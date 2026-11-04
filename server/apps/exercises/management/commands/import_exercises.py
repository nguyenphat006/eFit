"""
import_exercises — nhập thư viện bài tập từ bộ dữ liệu JSON (exercises-dataset).

    python manage.py import_exercises --file D:/Coder/Github/ERICSS/exercises-dataset/data/exercises.json

Đường dẫn mặc định lấy từ biến môi trường EXERCISES_DATASET. Idempotent: khóa theo media_id
(hoặc tên khi bản ghi nguồn không có media_id) — chạy lại chỉ cập nhật, không tạo trùng.
Mỗi phần tử JSON: name, category, body_part, equipment, target, muscle_group, secondary_muscles,
instructions / instruction_steps ({ngôn ngữ: ...}), media_id, image, gif_url.
"""
import json
import os
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.exercises.models import Exercise

FIELDS = ('category', 'body_part', 'equipment', 'target', 'muscle_group')


class Command(BaseCommand):
    help = "Nhap thu vien bai tap tu file JSON (idempotent theo media_id / ten)"

    def add_arguments(self, parser):
        parser.add_argument('--file', default=os.getenv('EXERCISES_DATASET'), help='Duong dan file exercises.json')
        parser.add_argument('--limit', type=int, default=None, help='Chi nhap N ban ghi dau (thu nghiem)')

    def handle(self, *args, **opts):
        path = opts['file']
        if not path:
            raise CommandError('Thieu --file (hoac bien moi truong EXERCISES_DATASET).')
        path = Path(path)
        if not path.is_file():
            raise CommandError(f'Khong tim thay file: {path}')
        data = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(data, list):
            raise CommandError('File JSON phai la mang cac bai tap.')
        if opts['limit']:
            data = data[:opts['limit']]

        by_media = {e.media_id: e for e in Exercise.all_objects.exclude(media_id__isnull=True).exclude(media_id='')}
        by_name = {e.name.lower(): e for e in Exercise.all_objects.filter(media_id__isnull=True)}
        created = updated = 0
        to_create = []
        with transaction.atomic():
            for item in data:
                name = (item.get('name') or '').strip()
                if not name:
                    continue
                values = {f: item.get(f) or None for f in FIELDS}
                values['secondary_muscles'] = item.get('secondary_muscles') or None
                values['instructions'] = item.get('instruction_steps') or item.get('instructions') or None
                values['image_url'] = item.get('image') or item.get('gif_url') or None
                media_id = item.get('media_id') or None
                existing = by_media.get(media_id) if media_id else by_name.get(name.lower())
                if existing:
                    existing.name = name
                    for key, val in values.items():
                        setattr(existing, key, val)
                    existing.save()
                    updated += 1
                else:
                    obj = Exercise(name=name, media_id=media_id, **values)
                    to_create.append(obj)
                    if media_id:
                        by_media[media_id] = obj
                    else:
                        by_name[name.lower()] = obj
                    created += 1
            Exercise.objects.bulk_create(to_create, batch_size=500)
        self.stdout.write(self.style.SUCCESS(f'Nhap xong: {created} moi, {updated} cap nhat.'))
