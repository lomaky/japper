CREATE FUNCTION `currval`(`seq_name` varchar(100))
RETURNS DECIMAL(60) NOT DETERMINISTIC
BEGIN
    DECLARE cur_val DECIMAL(60);
    SELECT
        sequence_cur_value INTO cur_val
    FROM
        SEQUENCE_DATA
    WHERE
        sequence_name = seq_name
    ;
    RETURN cur_val;
END;