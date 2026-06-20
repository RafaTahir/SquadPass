use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct LeaderboardEntry {
    pub subscriber: Pubkey,
    pub squad: Pubkey,
    pub total_points: u32,
    pub matches_predicted: u16,
    pub correct_winners: u16,
    pub correct_scorelines: u16,
    pub paid_cycles: u16,
    pub current_streak: u16,
    pub bump: u8,
}
