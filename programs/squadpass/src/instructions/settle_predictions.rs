use anchor_lang::prelude::*;

use crate::state::{MatchResult, Prediction, LeaderboardEntry};
use crate::errors::SquadPassError;

#[derive(Accounts)]
pub struct SettlePredictions<'info> {
    /// Anyone can settle (permissionless crank)
    pub settler: Signer<'info>,

    #[account(
        constraint = match_result.is_final @ SquadPassError::ResultNotFinal,
    )]
    pub match_result: Account<'info, MatchResult>,

    #[account(
        mut,
        seeds = [b"prediction", match_result.key().as_ref(), prediction.subscriber.as_ref()],
        bump = prediction.bump,
        constraint = !prediction.is_settled @ SquadPassError::AlreadySettled,
    )]
    pub prediction: Account<'info, Prediction>,

    #[account(
        mut,
        seeds = [b"leaderboard", leaderboard_entry.squad.as_ref(), leaderboard_entry.subscriber.as_ref()],
        bump = leaderboard_entry.bump,
        constraint = leaderboard_entry.subscriber == prediction.subscriber,
        constraint = leaderboard_entry.squad == prediction.squad,
    )]
    pub leaderboard_entry: Account<'info, LeaderboardEntry>,
}

pub fn handler(ctx: Context<SettlePredictions>) -> Result<()> {
    let match_result = &ctx.accounts.match_result;
    let prediction = &mut ctx.accounts.prediction;
    let leaderboard = &mut ctx.accounts.leaderboard_entry;

    let mut points: u16 = 1; // Base point for submitting a valid prediction

    // Determine actual winner
    let actual_home = match_result.home_score;
    let actual_away = match_result.away_score;
    let pred_home = prediction.home_score;
    let pred_away = prediction.away_score;

    // Check exact scoreline first (worth more)
    if pred_home == actual_home && pred_away == actual_away {
        points += 7;
        leaderboard.correct_scorelines = leaderboard.correct_scorelines.checked_add(1).unwrap();
        // Only count as correct winner if there IS a winner (not a draw)
        if actual_home != actual_away {
            leaderboard.correct_winners = leaderboard.correct_winners.checked_add(1).unwrap();
        }
    } else {
        // Check if winner prediction is correct
        let actual_winner = if actual_home > actual_away {
            1i8
        } else if actual_away > actual_home {
            -1i8
        } else {
            0i8
        };

        let pred_winner = if pred_home > pred_away {
            1i8
        } else if pred_away > pred_home {
            -1i8
        } else {
            0i8
        };

        if actual_winner == pred_winner {
            points += 3;
            leaderboard.correct_winners = leaderboard.correct_winners.checked_add(1).unwrap();
        }
    }

    // Update prediction
    prediction.points_awarded = points;
    prediction.is_settled = true;

    // Update leaderboard
    leaderboard.total_points = leaderboard.total_points.checked_add(points as u32).unwrap();
    leaderboard.matches_predicted = leaderboard.matches_predicted.checked_add(1).unwrap();

    // Streak: increment on correct prediction (points > 1), reset on wrong
    if points > 1 {
        leaderboard.current_streak = leaderboard.current_streak.checked_add(1).unwrap();
    } else {
        leaderboard.current_streak = 0;
    }

    msg!(
        "Prediction settled: {} points for subscriber {}",
        points,
        prediction.subscriber
    );
    Ok(())
}
