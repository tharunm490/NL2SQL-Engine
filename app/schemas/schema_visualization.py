from pydantic import BaseModel


class VisColumn(BaseModel):
    name: str
    type: str
    nullable: bool
    default: str | None = None
    primary_key: bool = False
    foreign_key: bool = False


class VisTable(BaseModel):
    name: str
    schema_name: str
    columns: list[VisColumn]
    row_count: int = 0


class Relationship(BaseModel):
    from_table: str
    from_column: str
    to_table: str
    to_column: str
    relationship: str  # ONE_TO_ONE, ONE_TO_MANY, MANY_TO_ONE, MANY_TO_MANY


class SchemaVisualization(BaseModel):
    tables: list[VisTable]
    relationships: list[Relationship]
