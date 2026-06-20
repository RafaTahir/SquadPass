use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("SqdP5rWKnBqEjY3HBHA9meEMEW7rGKgMFeeDNa6gqVh");

#[program]
pub mod squadpass {
    use super::*;

    pub fn create_squad(
        ctx: Context<CreateSquad>,
        squad_id: u64,
        country: String,
        name: String,
        subscription_amount: u64,
        cadence_seconds: i64,
    ) -> Result<()> {
        instructions::create_squad::handler(ctx, squad_id, country, name, subscription_amount, cadence_seconds)
    }

    pub fn join_squad(ctx: Context<JoinSquad>, max_charge_amount: u64) -> Result<()> {
        instructions::join_squad::handler(ctx, max_charge_amount)
    }

    pub fn execute_billing(ctx: Context<ExecuteBilling>) -> Result<()> {
        instructions::execute_billing::handler(ctx)
    }

    pub fn submit_prediction(
        ctx: Context<SubmitPrediction>,
        prediction_type: state::PredictionType,
        home_score: u8,
        away_score: u8,
    ) -> Result<()> {
        instructions::submit_prediction::handler(ctx, prediction_type, home_score, away_score)
    }

    pub fn post_result(
        ctx: Context<PostResult>,
        match_id: u64,
        home_team: String,
        away_team: String,
        kickoff_time: i64,
        home_score: u8,
        away_score: u8,
        is_final: bool,
    ) -> Result<()> {
        instructions::post_result::handler(ctx, match_id, home_team, away_team, kickoff_time, home_score, away_score, is_final)
    }

    pub fn settle_predictions(ctx: Context<SettlePredictions>) -> Result<()> {
        instructions::settle_predictions::handler(ctx)
    }

    pub fn cancel_subscription(ctx: Context<CancelSubscription>) -> Result<()> {
        instructions::cancel_subscription::handler(ctx)
    }
}
