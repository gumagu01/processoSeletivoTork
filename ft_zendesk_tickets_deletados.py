import os
import sys

module_root = os.path.join(os.path.dirname(__file__),'..')
sys.path.insert(0, os.path.abspath(module_root))

import pandas as pd
import numpy as np


class ZendeskTicketsDeletados:
    
    CONFIG_DB_DW = ConfigDBDW()

    DW_COLUMNS_INSERT = []

    API_COLUMNS_EXTRACT = []

    DW_COLUMNS_NOT_MANDATORY = []

    def __init__(self):
        self.dwdb = DwHook()
        self.zendesk_api = ZendeskApiHook()
        self.handle_insert = HandleInsert()
        self.surrogate_key = SurrogateKey()
    
    def execute_insert(self, limit):
        df = self.__get_df_to_insert(limit)
        return self.__execute_insert_by_df(df)
    
    def __get_df_to_insert(self, limit):
        last_inserted_date = self.handle_insert.get_last_insert_date(self.CONFIG_DB_DW.column_name_dt_insert,self.CONFIG_DB_DW.table_name)
        last_inserted_date = convert_brasileast_to_utc_tz(last_inserted_date)
        df = self.zendesk_api.df_extract_insert_deleted_tickets(last_inserted_date, self.API_COLUMNS_EXTRACT, limit)

        if len(df) > 0:        
            df = get_df_without_records_already_in_dw(df, 'id', self.CONFIG_DB_DW)

        return df
    
    def __execute_insert_by_df(self, df, insertType=InsertType.INSERT_DEFAULT):
        if len(df) > 0:
            print('Total de registros para inserir',len(df))
            df = self.__preparar_dados_para_insert(df)
            print('Total de registros tratados para serem inseridos:',len(df))

            request = construct_sql(df,self.CONFIG_DB_DW.table_name,'insert')
            DwHook().manipulation_query(request)
            
            print_max_and_min(df, 'id_ticket', 'inseridos')

            return 'Operação realizada com sucesso!'
        else: 
            return 'Nenhum registro para ser inserido'

    def __preparar_dados_para_insert(self,df):
        df = self.__tratar_dados(df)
        cols = get_columns(df.columns.tolist(), self.DW_COLUMNS_INSERT, self.DW_COLUMNS_NOT_MANDATORY)
        return df[cols]
    
    def __tratar_dados(self,df):
        df.rename(columns={'deleted_at':'dt_deletado','description':'ds_description',
                'id':self.CONFIG_DB_DW.column_name_id, 'subject':'ds_subject'}, inplace=True)

        datetime_columns = ['dt_deletado']
        df = handle_datetime_columns(df, datetime_columns)
        df = convert_utc_to_brasileast_tz(df, datetime_columns)

        if 'ds_description' in df:
            df['ds_description'] = df['ds_description'].apply(lambda row: (row.encode('latin1', 'ignore')).decode('latin1') if pd.notnull(row) else row)
        
        if 'ds_subject' in df:
            df['ds_subject'] = df['ds_subject'].apply(lambda row: (row.encode('latin1', 'ignore')).decode('latin1') if pd.notnull(row) else row)

        if 'actor' in df:
            df_actor = df.actor.apply(lambda s: pd.Series(s))
            df['id_actor'] = df_actor['id']
            df['actor_name'] = df_actor['name']
        df = df.drop(columns=['actor']) 
        del df_actor

        return df