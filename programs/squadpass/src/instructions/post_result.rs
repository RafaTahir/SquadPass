use anchor_lang::prelude::*;

use crate::state::{Squad, MatchResult};
use crate::errors::SquadPassError;

#[derive(Accounts)]
#[instruction(match_id: u64)]
pub struct PostResult<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        constraint = squad.organizer == authority.key() @ SquadPassError::Unauthorized,
        seeds = [b"squad", squad.organizer.as_ref(), &squad.squad_id.to_le_bytes()],
        bump = squad.bump,
    )]
    pub squad: Account<'info, Squad>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + MatchResult::INIT_SPACE,
        seeds = [b"match", squad.key().as_ref(), &match_id.to_le_bytes()],
        bump
    )]
    pub match_result: Account<'info, MatchResult>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<PostResult>,
    match_id: u64,
    home_team: String,
    away_team: String,
    kickoff_time: i64,
    home_score: u8,
    away_score: u8,
    is_final: bool,
) -> Result<()> {
    require!(home_team.len() <= 32, SquadPassError::CountryTooLong);
    require!(away_team.len() <= 32, SquadPassError::CountryTooLong);

    let match_result = &mut ctx.accounts.match_result;

    // Reinitialization guard: if account already initialized, verify authority
    if match_result.result_authority != Pubkey::default() {
        require!(
            match_result.result_authority == ctx.accounts.authority.key(),
            SquadPassError::Unauthorized
        );
    }

    match_result.match_id = match_id;
    match_result.home_team = home_team;
    match_result.away_team = away_team;
    match_result.kickoff_time = kickoff_time;
    match_result.home_score = home_score;
    match_result.away_score = away_score;
    match_result.is_final = is_final;
    match_result.result_authority = ctx.accounts.authority.key();
    match_result.squad = ctx.accounts.squad.key();
    match_result.bump = ctx.bumps.match_result;

    msg!("Match result posted for match {}", match_id);
    Ok(())
}
