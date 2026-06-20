use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct MatchResult {
    pub match_id: u64,
    #[max_len(32)]
    pub home_team: String,
    #[max_len(32)]
    pub away_team: String,
    pub kickoff_time: i64,
    pub home_score: u8,
    pub away_score: u8,
    pub is_final: bool,
    pub result_authority: Pubkey,
    pub squad: Pubkey,
    pub bump: u8,
}
