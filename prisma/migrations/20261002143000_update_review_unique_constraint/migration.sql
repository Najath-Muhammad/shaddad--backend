-- DropIndex
DROP INDEX "reviews_tripId_key";

-- CreateIndex
CREATE UNIQUE INDEX "reviews_tripId_reviewerRole_key" ON "reviews"("tripId", "reviewerRole");
