use anchor_lang::prelude::*;
use anchor_spl::token::{self, Revoke, Token, TokenAccount};

use crate::state::{Squad, Subscription, SubscriptionStatus};
use crate::errors::SquadPassError;

#[derive(Accounts)]
pub struct CancelSubscription<'info> {
    #[account(mut)]
    pub subscriber: Signer<'info>,

    #[account(
        mut,
        seeds = [b"squad", squad.organizer.as_ref(), &squad.squad_id.to_le_bytes()],
        bump = squad.bump,
    )]
    pub squad: Account<'info, Squad>,

    #[account(
        mut,
        constraint = subscription.subscriber == subscriber.key(),
        constraint = subscription.squad == squad.key(),
        constraint = subscription.status == SubscriptionStatus::Active @ SquadPassError::AlreadyCancelled,
        seeds = [b"subscription", squad.key().as_ref(), subscriber.key().as_ref()],
        bump = subscription.bump,
    )]
    pub subscription: Account<'info, Subscription>,

    #[account(
        mut,
        constraint = subscriber_token_account.owner == subscriber.key(),
        constraint = subscriber_token_account.mint == squad.token_mint,
    )]
    pub subscriber_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CancelSubscription>) -> Result<()> {
    // Revoke delegate authority
    let revoke_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Revoke {
            source: ctx.accounts.subscriber_token_account.to_account_info(),
            authority: ctx.accounts.subscriber.to_account_info(),
        },
    );
    token::revoke(revoke_ctx)?;

    // Update subscription status
    let subscription = &mut ctx.accounts.subscription;
    subscription.status = SubscriptionStatus::Cancelled;

    // Decrement member count
    let squad = &mut ctx.accounts.squad;
    squad.member_count = squad.member_count.saturating_sub(1);

    msg!("Subscription cancelled for subscriber {}", subscription.subscriber);
    Ok(())
}
