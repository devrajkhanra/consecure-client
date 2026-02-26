// Project Status enum matching backend
export enum ProjectStatus {
    BACKLOG = 'BACKLOG',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    ON_HOLD = 'ON_HOLD',
}

// Drawing column types
export enum ColumnType {
    TEXT = 'text',
    NUMBER = 'number',
    DATE = 'date',
    BOOLEAN = 'boolean',
}

// Material status
export enum MaterialStatus {
    REQUIRED = 'required',
    ISSUED = 'issued',
    USED = 'used',
    PENDING = 'pending',
    RETURNED = 'returned',
    REJECTED = 'rejected',
}

// ===== Project =====
export interface Project {
    id: string;
    name: string;
    workOrderNumber: string;
    location: string;
    clientName: string;
    startDate: string;
    endDate?: string | null;
    status: ProjectStatus;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProjectDto {
    name: string;
    workOrderNumber: string;
    location: string;
    clientName: string;
    startDate: string;
    endDate?: string;
    status?: ProjectStatus;
}

export type UpdateProjectDto = Partial<CreateProjectDto>;

// ===== Site =====
export interface Site {
    id: string;
    name: string;
    address: string;
    projectId: string;
    project?: Project;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSiteDto {
    name: string;
    address: string;
    projectId: string;
}

export type UpdateSiteDto = Partial<CreateSiteDto>;

// ===== Job =====
export interface Job {
    id: string;
    name: string;
    description?: string | null;
    siteId: string;
    site?: Site;
    createdAt: string;
    updatedAt: string;
}

export interface CreateJobDto {
    name: string;
    description?: string;
    siteId: string;
}

export type UpdateJobDto = Partial<CreateJobDto>;

// ===== Drawing Column =====
export interface DrawingColumn {
    id: string;
    name: string;
    type: ColumnType;
    required: boolean;
    order: number;
    isRevisionColumn: boolean;
    jobId: string;
}

export interface CreateDrawingColumnDto {
    name: string;
    type?: ColumnType;
    required?: boolean;
    order?: number;
    isRevisionColumn?: boolean;
}

export type UpdateDrawingColumnDto = Partial<CreateDrawingColumnDto>;

// ===== Drawing =====
export interface Drawing {
    id: string;
    data: Record<string, unknown>;
    revision: number;
    parentId?: string | null;
    isLatest: boolean;
    jobId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDrawingDto {
    data: Record<string, unknown>;
}

export type UpdateDrawingDto = Partial<CreateDrawingDto>;

// ===== Drawing Change History =====
export enum ChangeType {
    CREATED = 'created',
    UPDATED = 'updated',
    MERGED = 'merged',
    SPLIT = 'split',
    STOPPED = 'stopped',
    REMOVED = 'removed',
    UPGRADED = 'upgraded',
    RESTORED = 'restored',
}

export interface DrawingChangeHistory {
    id: string;
    drawingId: string;
    jobId: string;
    drawing?: Drawing;
    changeType: ChangeType;
    previousData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    relatedDrawingIds?: string[];
    reason?: string;
    changedBy?: string;
    createdAt: string;
}

export interface CreateDrawingChangeHistoryDto {
    changeType: ChangeType;
    previousData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    relatedDrawingIds?: string[];
    reason?: string;
    changedBy?: string;
}

// ===== Material Column =====
export interface MaterialColumn {
    id: string;
    name: string;
    type: ColumnType;
    required: boolean;
    order: number;
    jobId: string;
}

export interface CreateMaterialColumnDto {
    name: string;
    type?: ColumnType;
    required?: boolean;
    order?: number;
}

export type UpdateMaterialColumnDto = Partial<CreateMaterialColumnDto>;

// ===== Material =====
export interface Material {
    id: string;
    data: Record<string, unknown>;
    status: MaterialStatus;
    quantityRequired: number;
    quantityIssued: number;
    quantityUsed: number;
    unit?: string | null;
    remarks?: string | null;
    drawingId: string;
    drawing?: Drawing;
    createdAt: string;
    updatedAt: string;
}

export interface CreateMaterialDto {
    data: Record<string, unknown>;
    status?: MaterialStatus;
    quantityRequired?: number;
    quantityIssued?: number;
    quantityUsed?: number;
    unit?: string;
    remarks?: string;
}

export type UpdateMaterialDto = Partial<CreateMaterialDto>;

export interface UpdateMaterialStatusDto {
    status: MaterialStatus;
}

// ===== Material Summary =====
export interface MaterialSummary {
    status: MaterialStatus;
    count: number;
    totalRequired: number;
    totalIssued: number;
    totalUsed: number;
}

// ===== Material Transaction =====
export enum MaterialTransactionType {
    ISSUED = 'issued',
    USED = 'used',
    RETURNED = 'returned',
}

export interface MaterialTransaction {
    id: string;
    materialId: string;
    transactionType: MaterialTransactionType;
    quantity: number;
    documentNumber: string;
    transactionDate: string;
    remarks?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateMaterialTransactionDto {
    transactionType: MaterialTransactionType;
    quantity: number;
    documentNumber: string;
    transactionDate: string;
    remarks?: string;
}

export type UpdateMaterialTransactionDto = Partial<CreateMaterialTransactionDto>;

// ===== API Response Types =====
export interface ApiError {
    statusCode: number;
    message: string | string[];
    error?: string;
}
