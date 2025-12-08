-- Create Tag table
CREATE TABLE IF NOT EXISTS "Tag" (
    id TEXT NOT NULL,
    nom TEXT NOT NULL,
    couleur TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_pkey" PRIMARY KEY (id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Tag_userId_idx" ON "Tag"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_userId_nom_key" ON "Tag"("userId", nom);

-- Add foreign key to User table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Tag_userId_fkey'
    ) THEN
        ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add tagId column to Note table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Note' AND column_name = 'tagId'
    ) THEN
        ALTER TABLE "Note" ADD COLUMN "tagId" TEXT;
    END IF;
END $$;

-- Add foreign key from Note to Tag
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Note_tagId_fkey'
    ) THEN
        ALTER TABLE "Note" ADD CONSTRAINT "Note_tagId_fkey" 
        FOREIGN KEY ("tagId") REFERENCES "Tag"(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
