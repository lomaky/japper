CREATE FUNCTION `nextval` (`seq_name` varchar(100))
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
    IF cur_val IS NOT NULL THEN
        UPDATE
            SEQUENCE_DATA
        SET
            sequence_cur_value = IF (
                (sequence_cur_value + sequence_increment) > sequence_max_value,
                IF (
                    sequence_cycle = TRUE,
                    sequence_min_value,
                    NULL
                ),
                sequence_cur_value + sequence_increment
            )
        WHERE
            sequence_name = seq_name
        ;
    END IF;
    RETURN cur_val;
END;