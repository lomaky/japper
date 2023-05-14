CREATE TABLE `SEQUENCE_DATA` (
  `sequence_name` varchar(100) NOT NULL,
  `sequence_increment` decimal(60,0) NOT NULL DEFAULT '1',
  `sequence_min_value` decimal(60,0) NOT NULL DEFAULT '1',
  `sequence_max_value` decimal(60,0) NOT NULL DEFAULT '99999999999999999999999999999999999',
  `sequence_cur_value` decimal(60,0) DEFAULT '1',
  `sequence_cycle` decimal(1,0) NOT NULL DEFAULT '0',
  PRIMARY KEY (`sequence_name`)
);