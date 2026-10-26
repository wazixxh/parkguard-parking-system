from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class SettingItem(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SettingsResponse(BaseModel):
    settings: Dict[str, str]
    metadata: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class SettingsUpdateRequest(BaseModel):
    settings: Dict[str, str]
