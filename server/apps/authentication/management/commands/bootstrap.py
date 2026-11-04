"""
bootstrap — khởi tạo hệ thống mới trong 1 lệnh: migrate -> seed_core [-> seed_demo].

    python manage.py bootstrap           # production / dự án mới
    python manage.py bootstrap --demo    # kèm dữ liệu mẫu
"""
from django.core.management import call_command, get_commands
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Khoi tao he thong: migrate + seed_core (+ seed_demo khi co --demo)"

    def add_arguments(self, parser):
        parser.add_argument('--demo', action='store_true', help='Nap them du lieu mau (seed_demo)')

    def handle(self, *args, **options):
        call_command('migrate', interactive=False)
        call_command('seed_core')
        if options['demo']:
            # Dữ liệu mẫu eFit: nhóm thực phẩm + thực phẩm (idempotent). Thư viện bài tập nhập riêng bằng import_exercises.
            for command in ('seed_demo', 'seed_nutrition'):
                if command in get_commands():
                    call_command(command)
                else:
                    self.stdout.write(f"  (khong co lenh {command} -> bo qua)")
        self.stdout.write(self.style.SUCCESS("[SUCCESS] Bootstrap hoan tat."))
