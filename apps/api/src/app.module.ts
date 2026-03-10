import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CommonServicesModule } from './common/services/common-services.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { UsersModule } from './modules/users/users.module';
import { RequisitionsModule } from './modules/requisitions/requisitions.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { ApprovalRulesModule } from './modules/approval-rules/approval-rules.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { ReceivingModule } from './modules/receiving/receiving.module';
import { InvoicesModule } from './modules/invoices/invoices.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CommonServicesModule,
    VendorsModule,
    UsersModule,
    RequisitionsModule,
    PurchaseOrdersModule,
    ApprovalRulesModule,
    ApprovalsModule,
    BudgetsModule,
    ReceivingModule,
    InvoicesModule,
  ],
})
export class AppModule {}
