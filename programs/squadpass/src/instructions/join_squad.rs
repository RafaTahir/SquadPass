use anchor_lang::prelude::*;
use anchor_spl::token::{self, Approve, Token, TokenAccount, Transfer};

use crate::state::{Squad, Subscription, SubscriptionStatus, LeaderboardEntry};
use crate::errors::SquadPassError;

#[derive(Accounts)]
pub struct JoinSquad<'info> {
    #[account(mut)]
    pub subscriber: Signer<'info>,

    #[account(
        mut,
        seeds = [b"squad", squad.organizer.as_ref(), &squad.squad_id.to_le_bytes()],
        bump = squad.bump,
        constraint = squad.is_active @ SquadPassError::SquadNotActive
    )]
    pub squad: Account<'info, Squad>,

    #[account(
        init,
        payer = subscriber,
        space = 8 + Subscription::INIT_SPACE,
        seeds = [b"subscription", squad.key().as_ref(), subscriber.key().as_ref()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,

    #[account(
        init,
        payer = subscriber,
        space = 8 + LeaderboardEntry::INIT_SPACE,
        seeds = [b"leaderboard", squad.key().as_ref(), subscriber.key().as_ref()],
        bump
    )]
    pub leaderboard_entry: Account<'info, LeaderboardEntry>,

    #[account(
        mut,
        constraint = subscriber_token_account.owner == subscriber.key(),
        constraint = subscriber_token_account.mint == squad.token_mint,
    )]
    pub subscriber_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault.key() == squad.vault,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: This is the squad PDA used as delegate authority
    #[account(
        seeds = [b"squad", squad.organizer.as_ref(), &squad.squad_id.to_le_bytes()],
        bump = squad.bump,
    )]
    pub squad_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<JoinSquad>, max_charge_amount: u64) -> Result<()> {
    let clock = Clock::get()?;
    let squad = &mut ctx.accounts.squad;

    // Transfer first payment
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.subscriber_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.subscriber.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, squad.subscription_amount)?;

    // Approve squad PDA as delegate for future recurring charges
    let approve_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Approve {
            to: ctx.accounts.subscriber_token_account.to_account_info(),
            delegate: ctx.accounts.squad_authority.to_account_info(),
            authority: ctx.accounts.subscriber.to_account_info(),
        },
    );
    token::approve(approve_ctx, max_charge_amount)?;

    // Initialize subscription
    let subscription = &mut ctx.accounts.subscription;
    subscription.subscriber = ctx.accounts.subscriber.key();
    subscription.squad = squad.key();
    subscription.next_due_at = clock.unix_timestamp + squad.cadence_seconds;
    subscription.max_charge_amount = max_charge_amount;
    subscription.billing_interval = squad.cadence_seconds;
    subscription.status = SubscriptionStatus::Active;
    subscription.total_paid = squad.subscription_amount;
    subscription.last_paid_at = clock.unix_timestamp;
    subscription.created_at = clock.unix_timestamp;
    subscription.bump = ctx.bumps.subscription;

    // Initialize leaderboard entry
    let leaderboard = &mut ctx.accounts.leaderboard_entry;
    leaderboard.subscriber = ctx.accounts.subscriber.key();
    leaderboard.squad = squad.key();
    leaderboard.total_points = 0;
    leaderboard.matches_predicted = 0;
    leaderboard.correct_winners = 0;
    leaderboard.correct_scorelines = 0;
    leaderboard.paid_cycles = 1;
    leaderboard.current_streak = 1;
    leaderboard.bump = ctx.bumps.leaderboard_entry;

    // Increment member count
    squad.member_count = squad.member_count.checked_add(1).unwrap();

    msg!("Fan joined squad {}", squad.squad_id);
    Ok(())
}
