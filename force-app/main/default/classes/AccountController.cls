public  class AccountController {
    public static final String FINANCIAL_SERVICES = 'Financial Services';

    @AuraEnabled(cacheable=true)
    public static List<Account> getFinancialServiceAccounts(){
        try {
            return [
                SELECT Name, Owner.Name, Phone, Website, AnnualRevenue 
                FROM Account
                WHERE Industry = :FINANCIAL_SERVICES
                ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static Boolean isAccountEditable(){
        return Account.SObjectType.getDescribe().isUpdateable();
    }
}