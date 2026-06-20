use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::{Squad, Subscription, SubscriptionStatus, LeaderboardEntry};
use crate::errors::SquadPassError;

#[derive(Accounts)]
pub struct ExecuteBilling<'info> {
    /// Anyone can crank billing (permissionless)
    pub cranker: Signer<'info>,

    #[account(
        seeds = [b"squad", squad.organizer.as_ref(), &squad.squad_id.to_le_bytes()],
        bump = squad.bump,
        constraint = squad.is_active @ SquadPassError::SquadNotActive
    )]
    pub squad: Account<'info, Squad>,

    #[account(
        mut,
        seeds = [b"subscription", squad.key().as_ref(), subscription.subscriber.as_ref()],
        bump = subscription.bump,
        constraint = subscription.status == SubscriptionStatus::Active @ SquadPassError::SubscriptionNotActive,
    )]
    pub subscription: Account<'info, Subscription>,

    #[account(
        mut,
        seeds = [b"leaderboard", squad.key().as_ref(), leaderboard_entry.subscriber.as_ref()],
        bump = leaderboard_entry.bump,
        constraint = leaderboard_entry.subscriber == subscription.subscriber,
    )]
    pub leaderboard_entry: Account<'info, LeaderboardEntry>,

    #[account(
        mut,
        constraint = subscriber_token_account.owner == subscription.subscriber,
        constraint = subscriber_token_account.mint == squad.token_mint,
    )]
    pub subscriber_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault.key() == squad.vault,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: Squad PDA used as delegate authority for transfer
    #[account(
        seeds = [b"squad", squad.organizer.as_ref(), &squad.squad_id.to_le_bytes()],
        bump = squad.bump,
    )]
    pub squad_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ExecuteBilling>) -> Result<()> {
    let clock = Clock::get()?;
    let subscription = &mut ctx.accounts.subscription;
    let squad = &ctx.accounts.squad;

    // Check payment is due
    require!(
        clock.unix_timestamp >= subscription.next_due_at,
        SquadPassError::PaymentNotDue
    );

    // Check delegate allowance is sufficient
    let token_account = &ctx.accounts.subscriber_token_account;
    require!(
        token_account.delegated_amount >= squad.subscription_amount,
        SquadPassError::InsufficientAllowance
    );

    // Build PDA signer seeds
    let organizer_key = squad.organizer;
    let squad_id_bytes = squad.squad_id.to_le_bytes();
    let bump = &[squad.bump];
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"squad",
        organizer_key.as_ref(),
        &squad_id_bytes,
        bump,
    ]];

    // Transfer using delegate authority (squad PDA)
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.subscriber_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.squad_authority.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, squad.subscription_amount)?;

    // Update subscription
    subscription.next_due_at = subscription.next_due_at + subscription.billing_interval;
    subscription.total_paid = subscription.total_paid.checked_add(squad.subscription_amount).unwrap();
    subscription.last_paid_at = clock.unix_timestamp;

    // Update leaderboard
    let leaderboard = &mut ctx.accounts.leaderboard_entry;
    leaderboard.paid_cycles = leaderboard.paid_cycles.checked_add(1).unwrap();

    msg!("Billing executed for subscriber {}", subscription.subscriber);
    Ok(())
}
