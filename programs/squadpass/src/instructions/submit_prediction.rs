use anchor_lang::prelude::*;

use crate::state::{Subscription, SubscriptionStatus, MatchResult, Prediction, PredictionType};
use crate::errors::SquadPassError;

#[derive(Accounts)]
pub struct SubmitPrediction<'info> {
    #[account(mut)]
    pub subscriber: Signer<'info>,

    #[account(
        seeds = [b"subscription", subscription.squad.as_ref(), subscriber.key().as_ref()],
        bump = subscription.bump,
        constraint = subscription.subscriber == subscriber.key(),
        constraint = subscription.status == SubscriptionStatus::Active @ SquadPassError::SubscriptionNotActive,
    )]
    pub subscription: Account<'info, Subscription>,

    #[account(
        constraint = match_result.squad == subscription.squad,
    )]
    pub match_result: Account<'info, MatchResult>,

    #[account(
        init,
        payer = subscriber,
        space = 8 + Prediction::INIT_SPACE,
        seeds = [b"prediction", match_result.key().as_ref(), subscriber.key().as_ref()],
        bump
    )]
    pub prediction: Account<'info, Prediction>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<SubmitPrediction>,
    prediction_type: PredictionType,
    home_score: u8,
    away_score: u8,
) -> Result<()> {
    let clock = Clock::get()?;
    let match_result = &ctx.accounts.match_result;

    // Ensure prediction window is still open (before kickoff)
    require!(
        clock.unix_timestamp < match_result.kickoff_time,
        SquadPassError::PredictionWindowClosed
    );

    let prediction = &mut ctx.accounts.prediction;
    prediction.match_id = match_result.match_id;
    prediction.subscriber = ctx.accounts.subscriber.key();
    prediction.squad = ctx.accounts.subscription.squad;
    prediction.prediction_type = prediction_type;
    prediction.home_score = home_score;
    prediction.away_score = away_score;
    prediction.submitted_at = clock.unix_timestamp;
    prediction.is_settled = false;
    prediction.points_awarded = 0;
    prediction.bump = ctx.bumps.prediction;

    msg!("Prediction submitted for match {}", match_result.match_id);
    Ok(())
}
