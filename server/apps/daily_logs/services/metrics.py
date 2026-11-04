"""
Chỉ số tính từ nhật ký hằng ngày (hàm thuần, không truy vấn CSDL):
- Điểm kỷ luật (compliance score) 0-100.
- Chỉ số mệt mỏi DFI (Daily Fatigue Index) 0-100.
"""
from decimal import Decimal
from typing import Optional

NUTRITION_WEIGHT = 0.5
WORKOUT_WEIGHT = 0.3
WEIGHT_LOG_WEIGHT = 0.2
CARDIO_STEPS_WEIGHT = 0.2
UNPLANNED_CHEAT_PENALTY = 30.0
STEPS_TARGET = 10000
CARDIO_MINUTES_TARGET = 30


def calculate_compliance(log) -> Decimal:
    """
    Điểm kỷ luật = trung bình có trọng số các thành phần có dữ liệu:
    dinh dưỡng theo bữa (0.5, trừ 30 điểm nếu ăn ngoài kế hoạch), tập luyện (0.3),
    ghi cân nặng (0.2), cardio / bước chân (0.2 — chỉ tính khi có số liệu).
    """
    scores, weights = [], []

    if log.diet_meals_completed is not None and log.diet_target_meals:
        pct = log.diet_meals_completed / log.diet_target_meals * 100.0
        if log.diet_cheat_status == 'UNPLANNED':
            pct -= UNPLANNED_CHEAT_PENALTY
        scores.append(max(0.0, min(100.0, pct)) * NUTRITION_WEIGHT)
        weights.append(NUTRITION_WEIGHT)

    scores.append((100.0 if log.is_workout_completed else 0.0) * WORKOUT_WEIGHT)
    weights.append(WORKOUT_WEIGHT)

    scores.append((100.0 if log.weight is not None else 0.0) * WEIGHT_LOG_WEIGHT)
    weights.append(WEIGHT_LOG_WEIGHT)

    cardio_pct, has_cardio = 0.0, False
    if log.steps:
        has_cardio = True
        cardio_pct = min(100.0, log.steps / STEPS_TARGET * 100.0)
    if log.cardio_duration_minutes:
        has_cardio = True
        cardio_pct = max(cardio_pct, min(100.0, log.cardio_duration_minutes / CARDIO_MINUTES_TARGET * 100.0))
    if has_cardio:
        scores.append(cardio_pct * CARDIO_STEPS_WEIGHT)
        weights.append(CARDIO_STEPS_WEIGHT)

    return Decimal(str(round(sum(scores) / sum(weights), 1)))


def calculate_dfi(sleep_hours, work_hours, fatigue_level) -> Optional[float]:
    """
    DFI = 0.4 * F_ngủ + 0.3 * F_làm_việc + 0.3 * F_chủ_quan, chuẩn hóa theo thành phần có dữ liệu.
    0 = không mệt, 100 = kiệt sức.
    """
    components, weights = [], []
    if sleep_hours is not None:
        components.append(0.4 * max(0.0, (8.0 - float(sleep_hours)) / 8.0 * 100.0))
        weights.append(0.4)
    if work_hours is not None:
        components.append(0.3 * min(100.0, float(work_hours) / 10.0 * 100.0))
        weights.append(0.3)
    if fatigue_level is not None:
        components.append(0.3 * fatigue_level * 20.0)
        weights.append(0.3)
    if not weights:
        return None
    return round(sum(components) / sum(weights), 1)
