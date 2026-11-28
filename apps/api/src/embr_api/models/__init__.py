"""Every table model. Importing this package puts all of them on `Base.metadata`,
which is what Alembic compares against when it writes a migration."""

from embr_api.models.base import Base
from embr_api.models.check_in import CheckIn
from embr_api.models.user import User

__all__ = ["Base", "CheckIn", "User"]
