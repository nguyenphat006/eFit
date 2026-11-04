"""rebuild_session_phase_dailylog

Revision ID: 46fc111c67f3
Revises: 2832fb7517ad
Create Date: 2026-06-02 19:49:25.124472

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '46fc111c67f3'
down_revision: Union[str, None] = '2832fb7517ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Step 1: Drop old tables (session depends on phase, so drop session first) ──
    op.drop_table('session')
    op.drop_table('phase')

    # ── Step 2: Create new Session table (Mùa giải) ──
    op.create_table('session',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('goal_type', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default='Maintaining'),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default='Draft'),
        # TimeStampedModel fields (is_active serves double duty: soft-delete + session active flag)
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='false', nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_session_user_id'), 'session', ['user_id'], unique=False)

    # ── Step 3: Create new Phase table ──
    op.create_table('phase',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        # Nutrition targets
        sa.Column('target_calories', sa.Float(), nullable=True),
        sa.Column('target_protein', sa.Float(), nullable=True),
        sa.Column('target_carbs', sa.Float(), nullable=True),
        sa.Column('target_fat', sa.Float(), nullable=True),
        # Workout program (clone)
        sa.Column('workout_program_id', sa.Integer(), nullable=True),
        # Compliance weights
        sa.Column('nutrition_score_weight', sa.Float(), nullable=False, server_default='0.5'),
        sa.Column('workout_score_weight', sa.Float(), nullable=False, server_default='0.3'),
        sa.Column('weight_score_weight', sa.Float(), nullable=False, server_default='0.2'),
        # TimeStampedModel fields
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['session.id'], ),
        sa.ForeignKeyConstraint(['workout_program_id'], ['workoutprogram.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_phase_session_id'), 'phase', ['session_id'], unique=False)

    # ── Step 4: ALTER dailylog — add new columns ──
    op.add_column('dailylog', sa.Column('phase_id', sa.Integer(), nullable=True))
    op.add_column('dailylog', sa.Column('target_calories_snapshot', sa.Float(), nullable=True))
    op.add_column('dailylog', sa.Column('target_protein_snapshot', sa.Float(), nullable=True))
    op.add_column('dailylog', sa.Column('target_carbs_snapshot', sa.Float(), nullable=True))
    op.add_column('dailylog', sa.Column('target_fat_snapshot', sa.Float(), nullable=True))
    op.add_column('dailylog', sa.Column('protein_in', sa.Float(), nullable=True))
    op.add_column('dailylog', sa.Column('carbs_in', sa.Float(), nullable=True))
    op.add_column('dailylog', sa.Column('fat_in', sa.Float(), nullable=True))
    op.add_column('dailylog', sa.Column('is_workout_completed', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('dailylog', sa.Column('body_images', sa.JSON(), nullable=True))

    # Change calories_in from INTEGER to Float
    op.alter_column('dailylog', 'calories_in',
               existing_type=sa.INTEGER(),
               type_=sa.Float(),
               existing_nullable=True)

    op.create_index(op.f('ix_dailylog_log_date'), 'dailylog', ['log_date'], unique=False)
    op.create_index(op.f('ix_dailylog_phase_id'), 'dailylog', ['phase_id'], unique=False)
    op.create_index(op.f('ix_dailylog_user_id'), 'dailylog', ['user_id'], unique=False)
    op.create_unique_constraint('uq_dailylog_user_date', 'dailylog', ['user_id', 'log_date'])
    op.create_foreign_key('fk_dailylog_phase_id', 'dailylog', 'phase', ['phase_id'], ['id'])

    # ── Step 5: WorkoutProgram — add source_program_id for clone tracking ──
    op.add_column('workoutprogram', sa.Column('source_program_id', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Reverse: drop new columns, drop new tables, recreate old tables
    op.drop_column('workoutprogram', 'source_program_id')

    op.drop_constraint('fk_dailylog_phase_id', 'dailylog', type_='foreignkey')
    op.drop_constraint('uq_dailylog_user_date', 'dailylog', type_='unique')
    op.drop_index(op.f('ix_dailylog_user_id'), table_name='dailylog')
    op.drop_index(op.f('ix_dailylog_phase_id'), table_name='dailylog')
    op.drop_index(op.f('ix_dailylog_log_date'), table_name='dailylog')
    op.alter_column('dailylog', 'calories_in',
               existing_type=sa.Float(),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.drop_column('dailylog', 'body_images')
    op.drop_column('dailylog', 'is_workout_completed')
    op.drop_column('dailylog', 'fat_in')
    op.drop_column('dailylog', 'carbs_in')
    op.drop_column('dailylog', 'protein_in')
    op.drop_column('dailylog', 'target_fat_snapshot')
    op.drop_column('dailylog', 'target_carbs_snapshot')
    op.drop_column('dailylog', 'target_protein_snapshot')
    op.drop_column('dailylog', 'target_calories_snapshot')
    op.drop_column('dailylog', 'phase_id')

    # Drop new tables
    op.drop_table('phase')
    op.drop_table('session')

    # Recreate old tables (basic structure)
    op.create_table('phase',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('compliance_score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table('session',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('phase_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('workout_date', sa.Date(), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False),
        sa.Column('compliance_rating', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.ForeignKeyConstraint(['phase_id'], ['phase.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
