CREATE FUNCTION `pojoviewgen`(p_table varchar(8000)) RETURNS text CHARSET utf8mb4
begin 
	declare pojo text(80000);
    declare pojoMetaData text(80000);
    declare pojoInsertData text(8000);
    declare spc text(10);
    declare p_type varchar(50);
    declare col_name varchar(200);
    declare dat_type varchar(200);
    declare nul_col varchar(100);
    declare exit_loop BOOLEAN DEFAULT FALSE ;    
    declare c_columns cursor for
    select column_name, data_type, is_nullable from information_schema.columns
	where table_name = p_table and table_schema = database()
    order by ordinal_position;
	declare CONTINUE HANDLER FOR NOT FOUND SET exit_loop = TRUE;
	set spc := '    ';
    set pojo := '/* eslint-disable @typescript-eslint/naming-convention */';
    set pojo := concat(pojo, char(10), 'import { PojoMetadata } from \'japper-mysql\';'); 
    set pojoMetaData := char(10);
    set pojoInsertData := char(10); 
    set pojo := concat(pojo, char(10), 'export interface ', p_table, ' {'); 
    set pojoMetaData := concat(pojoMetaData, char(10), 'export class ', p_table, 'Metadata implements PojoMetadata {'); 
    set pojoMetaData := concat(pojoMetaData, char(10), spc, 'constructor() {}'); 
    set pojoMetaData := concat(pojoMetaData, char(10));    
    set pojoMetaData := concat(pojoMetaData, char(10), spc, 'getIdField(): string { return \'\'; }');
    set pojoMetaData := concat(pojoMetaData, char(10));
    set pojoMetaData := concat(pojoMetaData, char(10), spc, 'getTableName(): string { return \'', p_table, '\'; }');
	set pojoMetaData := concat(pojoMetaData, char(10));
    set pojoMetaData := concat(pojoMetaData, char(10), spc, 'getUpdatableFields(): string[] {');
    set pojoMetaData := concat(pojoMetaData, char(10), spc, spc, 'return [');
    set pojoInsertData := concat(pojoInsertData, char(10), spc, 'getInsertableFields(): string[] {');
    set pojoInsertData := concat(pojoInsertData, char(10), spc, spc, 'return [');
	OPEN c_columns;
	read_loop: LOOP
		FETCH c_columns INTO col_name, dat_type, nul_col;
		IF exit_loop THEN
			LEAVE read_loop;
		END IF;
		if     dat_type like 'decimal'   and nul_col like 'YES'  	then set p_type := 'number | null';
		ELSEIF dat_type like 'decimal'                              then set p_type := 'number';
		ELSEIF dat_type like 'datetime' and nul_col like 'YES'  	then set p_type := 'Date | null';
		ELSEIF dat_type like 'datetime'                             then set p_type := 'Date';    
		ELSEIF nul_col like 'YES' 			    					then set p_type := 'string | null';
        ELSE 														set p_type := 'string';
		end if;		
		set pojo := concat(pojo, char(10), spc, col_name, ': ', p_type, ';');              
        ITERATE read_loop;
	END LOOP read_loop;
    CLOSE c_columns;
    set pojo := concat(pojo, char(10), '}'); 
    set pojoMetaData := concat(pojoMetaData, char(10), spc, spc, '];');  
    set pojoMetaData := concat(pojoMetaData, char(10), spc, '}');
    set pojoInsertData := concat(pojoInsertData, char(10), spc, spc, '];');  
    set pojoInsertData := concat(pojoInsertData, char(10), spc, '}');
    set pojoMetaData := concat(pojoMetaData, pojoInsertData);
    set pojoMetaData := concat(pojoMetaData, char(10), '}');
    set pojo := concat(pojo, pojoMetaData);
    return pojo;
end;