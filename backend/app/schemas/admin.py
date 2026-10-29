from datetime import date

from pydantic import BaseModel, Field, model_validator


class IngestRequest(BaseModel):
    start: date = Field(alias="from")
    end: date = Field(alias="to")

    model_config = {"populate_by_name": True}

    @model_validator(mode="after")
    def _ordered(self) -> "IngestRequest":
        if self.end < self.start:
            raise ValueError("'to' must not be before 'from'")
        return self


class IngestResponse(BaseModel):
    coverage: dict[str, str]
