-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_inventoryAccountId_fkey" FOREIGN KEY ("inventoryAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
