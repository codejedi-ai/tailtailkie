import json
import os
from datetime import datetime, timedelta
from http import HTTPStatus
from time import sleep

import requests
from atlassian import Jira
from dateutil import parser
from dependency_injector.wiring import Provide, inject
from flask import request, session

from im_db_backend.common.exceptions import APIException
from im_db_backend.DAL.models.base import entity_to_dict


class IncidentObject:
    def __init__(
        self,
        issue_data,
    ):
        """
        The Jira API gives us a data json structure representing the incident ticket.
        Here we grab the fields we care about and convert it into a python object.
        """
        self.jira_fields = {
            "duration": "customfield_13703",
            "downtime": "customfield_16281",
            "division": "customfield_11005",
            "components": "customfield_16495",
            "mas_downtime_trading_platform": "customfield_16699",
            "mas_downtime_authentication": "customfield_16752",
        }
        self.key = issue_data["key"]
        self.summary = issue_data["fields"]["summary"]
        self.created_date = parser.parse(issue_data["fields"]["created"])
        self.duration_minutes = self.__get_int_field(
            "duration", issue_data, default_value=1
        )
        self.downtime_minutes = self.__get_int_field("downtime", issue_data)
        self.components = self.__get_list_field("components", issue_data)
        self.divisions = self.__get_list_field("division", issue_data)
        self.mas_downtime_trading_platform = self.__get_int_field(
            "mas_downtime_trading_platform", issue_data
        )
        self.mas_downtime_authentication = self.__get_int_field(
            "mas_downtime_authentication", issue_data
        )

    def __str__(self) -> str:
        return str(self.to_dict())

    def to_dict(self):
        return {
            "key": self.key,
            "summary": self.summary,
            "created_date": self.created_date,
            "duration_minutes": self.duration_minutes,
            "downtime_minutes": self.downtime_minutes,
            "components": self.components,
            "divisions": self.divisions,
            # "mas_downtime_trading_platform": self.mas_downtime_trading_platform,
            # "mas_downtime_authentication": self.mas_downtime_authentication,
        }

    def __get_raw_field(self, field_name, issue_data, default_value=None):
        field_code = self.jira_fields[field_name]
        try:
            rawval = issue_data["fields"][field_code]
        except KeyError:
            print(
                f"'{issue_data['key']}' is missing '{field_name}' field ('{field_code}')"
            )
            rawval = default_value
        return rawval

    def __get_int_field(self, field_name, issue_data, default_value=0):
        rawval = self.__get_raw_field(field_name, issue_data, default_value)
        if rawval is None:
            return default_value
        if isinstance(rawval, (int, float)):
            return int(rawval)
        # Convert string to integer, discarding non-digit characters
        # (this doesn't support negative integers, but we don't care because those are always invalid for the fields we care about)
        numeric_filter = filter(str.isdigit, rawval)
        return int("".join(numeric_filter))

    def __get_list_field(self, field_name, issue_data, default_value=[]):
        rawval = self.__get_raw_field(field_name, issue_data, default_value)
        if rawval is None:
            return default_value
        if isinstance(rawval, list):
            return rawval
        print(
            f"'{issue_data['key']}' expected list '{field_name}' field ('{field_name}') but found '{repr(rawval)}' instead"
        )
        return default_value


class JiraService:
    @inject
    def __init__(
        self,
        # logger=Provide["app.logger_singleton"],
        secrets=Provide["configuration.secrets"],
        config_params=Provide["configuration.config_params"],
        imdb_repository=Provide["repositories.imdb_repository"],

    ):
        # self.logger = logger
        self.secrets = secrets
        self.config_params = config_params
        self.imdb_repository = imdb_repository
        self.jira = self.create_jira_service()

    def create_jira_service(self):
        jira_user = self.secrets.JIRA_USERNAME
        jira_passwd = self.secrets.JIRA_PASSWORD
        jira_client = Jira(
            url=os.getenv("JIRA_URL", "https://your-jira-instance.atlassian.net"),
            username=jira_user,
            password=jira_passwd,
        )
        return jira_client

    def import_incidents(self, jira_id):
        JIRA_USERNAME = self.secrets.JIRA_USERNAME
        JIRA_PASSWORD = self.secrets.JIRA_PASSWORD
        print("JIRA_USERNAME = {JIRA_USERNAME} JIRA_PASSWORD = {JIRA_PASSWORD}".format(
            JIRA_USERNAME=JIRA_USERNAME, JIRA_PASSWORD=JIRA_PASSWORD))
        self.get_incidents(jira_id)

    def get_incidents(self, issue):
        div_list = ["div10_OJCFDs",  "div11_OAU", "div12_OME",
                    "div13_OGM",
                    "div1_OC",
                    "div2_OCAN",
                    "div3_OAP",
                    "div4_OEL",
                    "div5_UNKNOWN",
                    "div6_OCCORP",
                    "div7_OAPCFDs",
                    "div8_UNKNOWN",
                    "div9_OJ",]
        ret = {'incident_duration': 683,
               'platform_outage_duration': 1133,
               'im': "customfield_16699",
               'im_creation_date': "2020-10-01T00:00:00.000+0000",
               "div10_OJCFDs": 0,
               "div11_OAU": 0,
               "div12_OME": 0,
               "div13_OGM": 0,
               "div1_OC": 0,
               "div2_OCAN": 0,
               "div3_OAP": 0,
               "div4_OEL": 0,
               "div5_UNKNOWN": 0,
               "div6_OCCORP": 0,
               "div7_OAPCFDs": 0,
               "div8_UNKNOWN": 0,
               "div9_OJ": 0,
               "cac_Account_Opening": 0,
               "cac_Client_Access_Account": 0,
               "cac_Client_Deposit": 0,
               "cac_Client_Withdrawal": 0,
               "cac_Internal_Hedging": 0,
               "cac_Internal_Reconciliation": 0,
               "cac_Login": 0,
               "cac_Saleforce": 0,
               "cac_Trading_Platform": 0,
               "cac_User_Pricing": 0,
               "cac_Website": 0}

        issue_data = (self.jira.issue(issue))
        im = IncidentObject(issue_data)
        # print(im)
        a = im.to_dict()
        ret["platform_outage_duration"] = a["downtime_minutes"]
        ret["incident_duration"] = a["duration_minutes"]
        ret['im'] = a['key']
        ret['im_creation_date'] = a['created_date']

        # check is there only one division called all
        if len(a["divisions"]) == 1 and a["divisions"][0]["value"] == "All":
            for i in div_list:
                ret[i] = 1
        else:
            for i in a["divisions"]:
                ret[self.parse_division(i["value"])] = 1

        if not (len(a["divisions"]) == 1 and a["divisions"][0]["value"] == "No Outage"):
            for i in a["components"]:
                ret[self.append_cas(i["value"])] = 1

        print("adding incident")
        print(ret)
        self.imdb_repository.add_incident(incident_data=ret)
        # parse strings like Div1 - OC to div1_OC

    def parse_division(self, division):
        division_arr = division.split(" - ")
        region = division_arr[1]
        div = division_arr[0].lower()

        ret = div + "_" + region
        if len(division_arr) > 2:
            ret = ret + "CDFs"
        return ret

    def append_cas(self, cac):
        return "cac_" + cac
