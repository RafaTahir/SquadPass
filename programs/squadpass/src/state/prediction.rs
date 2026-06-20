use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum PredictionType {
    Winner,
    Scoreline,
}

#[account]
#[derive(InitSpace)]
pub struct Prediction {
    pub match_id: u64,
    pub subscriber: Pubkey,
    pub squad: Pubkey,
    pub prediction_type: PredictionType,
    pub home_score: u8,
    pub away_score: u8,
    pub submitted_at: i64,
    pub is_settled: bool,
    pub points_awarded: u16,
    pub bump: u8,
}
