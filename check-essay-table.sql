-- Run this first to see what columns actually exist
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_name = 'EssaySubmission'
ORDER BY
    ordinal_position;
