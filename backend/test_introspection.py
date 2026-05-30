from app.main import app
from app.api.deps import RequirePermission

for route in app.routes:
    if hasattr(route, 'dependant'):
        print(f"Path: {route.path}, Methods: {route.methods}, Tags: {getattr(route, 'tags', [])}")
        for dep in route.dependant.dependencies:
            if isinstance(dep.call, RequirePermission):
                print(f"  Required Permission: {dep.call.required_permission}")
