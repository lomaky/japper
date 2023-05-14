CREATE FUNCTION `setval` (`seq_name` varchar(100), `new_val` DECIMAL(60))
RETURNS DECIMAL(60) NOT DETERMINISTIC
BEGIN
    UPDATE
		SEQUENCE_DATA
	SET
		sequence_cur_value = new_val
    WHERE
        sequence_name = seq_name
    ;
    RETURN new_val;
END;