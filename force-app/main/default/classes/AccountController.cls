public class AccountController {
    public static final String FINANCIAL_SERVICES = 'Financial Services';

    @AuraEnabled(cacheable=true)
    public static AccountData getAccountData() {
        List<Account> accounts = new List<Account>();
        Boolean isEditable = false;

        try {
            accounts = [
                SELECT Name, Owner.Name, Phone, Website, AnnualRevenue 
                FROM Account
                WHERE Industry = :FINANCIAL_SERVICES
            ];

            isEditable = Account.SObjectType.getDescribe().isUpdateable();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }

        return new AccountData(accounts, isEditable);
    }

    public class AccountData {
        @AuraEnabled
        public List<Account> accounts;
        @AuraEnabled
        public Boolean isEditable;

        public AccountData(List<Account> accounts, Boolean isEditable) {
            this.accounts = accounts;
            this.isEditable = isEditable;
        }
    }
}