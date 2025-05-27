import { IsNotEmpty, IsString } from "class-validator";

export default class ChangeTenantDto {
    @IsString()
    @IsNotEmpty()
    tenantId!: string;
}