from sqlalchemy import Column, DateTime, Integer, Numeric, String

from im_db_backend.DAL.models.base import Base, entity_to_dict


class Imdb(Base):
    __tablename__ = "imdb"
    incident_duration = Column(Integer(), nullable=False)
    platform_outage_duration = Column(Integer(), nullable=False)
    added_platform_outage_duration = Column(Numeric(), nullable=True)
    added_to_downtime = Column(String(length=1), nullable=True)
    weekday = Column(String(length=3), nullable=True)
    platform_impact_assessment = Column(String(length=12), nullable=True)
    brief_description = Column(String(length=512), nullable=True)
    root_cause = Column(String(length=64), nullable=True)
    customer_impact = Column(String(length=1024), nullable=True)

    cac_Website = Column(Integer(), nullable=False)
    cac_Login = Column(Integer(), nullable=False)
    cac_Trading_Platform = Column(Integer(), nullable=False)
    cac_Client_Deposit = Column(Integer(), nullable=False)
    cac_Client_Withdrawal = Column(Integer(), nullable=False)
    cac_Client_Access_Account = Column(Integer(), nullable=False)
    cac_Account_Opening = Column(Integer(), nullable=False)
    cac_Saleforce = Column(Integer(), nullable=False)
    cac_User_Pricing = Column(Integer(), nullable=False)
    cac_Internal_Hedging = Column(Integer(), nullable=False)
    cac_Internal_Reconciliation = Column(Integer(), nullable=False)

    im = Column(String(length=12), nullable=False)
    im_creation_date = Column(DateTime(), nullable=True)
    pagerduty = Column(String(length=32), nullable=True)
    jira_ticket = Column(String(length=12), nullable=True)
    compliance_report = Column(String(length=16), nullable=True)
    post_mortem = Column(String(length=16), nullable=True)

    div1_OC = Column(Integer(), nullable=False)
    div2_OCAN = Column(Integer(), nullable=False)
    div3_OAP = Column(Integer(), nullable=False)
    div4_OEL = Column(Integer(), nullable=False)
    div5_UNKNOWN = Column(Integer(), nullable=True)
    div6_OCCORP = Column(Integer(), nullable=False)
    div7_OAPCFDs = Column(Integer(), nullable=False)
    div8_UNKNOWN = Column(Integer(), nullable=True)
    div9_OJ = Column(Integer(), nullable=False)
    div10_OJCFDs = Column(Integer(), nullable=False)
    div11_OAU = Column(Integer(), nullable=False)
    div12_OME = Column(Integer(), nullable=False)
    div13_OGM = Column(Integer(), nullable=False)

    com = Column(String(length=16), nullable=True)
    compensation_paid = Column(String(length=16), nullable=True)

    def to_dict(self):
        return entity_to_dict(self)
