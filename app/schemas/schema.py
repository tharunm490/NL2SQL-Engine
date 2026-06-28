from pydantic import BaseModel


class ColumnInfo(BaseModel):
    column_name: str
    data_type: str
    is_nullable: bool
    column_default: str | None
    is_primary_key: bool
    is_foreign_key: bool
    referenced_table: str | None
    referenced_column: str | None


class TableInfo(BaseModel):
    table_name: str
    table_type: str
    columns: list[ColumnInfo]


class IndexInfo(BaseModel):
    index_name: str
    index_type: str
    columns: list[str]
    is_unique: bool


class ViewInfo(BaseModel):
    view_name: str
    definition: str | None


class SchemaResponse(BaseModel):
    tables: list[TableInfo]
    views: list[ViewInfo]
    indexes: list[IndexInfo]
