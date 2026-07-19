import uuid

from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    domain: str = Field(
        min_length=3,
        max_length=255,
        description="Company email domain, e.g. 'acme.com'. Employees whose work "
        "email ends with this domain can sign up under this organization.",
    )


class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    domain: str

    class Config:
        from_attributes = True
