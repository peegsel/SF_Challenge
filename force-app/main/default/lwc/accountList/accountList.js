import { LightningElement, wire } from "lwc"; 
import getAccountData from "@salesforce/apex/AccountController.getAccountData";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import { updateRecord } from "lightning/uiRecordApi";

import success_Title from "@salesforce/label/c.Success_Title";
import success_Message from "@salesforce/label/c.Success_Message";
import error_Title from "@salesforce/label/c.Error_Title";
import error_Message from "@salesforce/label/c.Error_Message";
import success_Variant from "@salesforce/label/c.success";
import error_Variant from "@salesforce/label/c.Error";
import search_List from "@salesforce/label/c.Search_List";

const LABELS = {
  success: {
    title: success_Title,
    message: success_Message,
    variant: success_Variant,
  },
  error: {
    title: error_Title,
    message: error_Message,
    variant: error_Variant,
  },
  search_List,
};

const COLUMNS = [
  {
    label: "Account Name",
    fieldName: "accountUrl",
    type: "url",
    typeAttributes: { label: { fieldName: "Name" }, target: "_blank" },
    sortable: true,
  },
  {
    label: "Account Owner",
    fieldName: "OwnerName",
    type: "text",
    sortable: true,
  },
  { label: "Phone", fieldName: "Phone", type: "phone", editable: true },
  { label: "Website", fieldName: "Website", type: "url", editable: true },
  {
    label: "Annual Revenue",
    fieldName: "AnnualRevenue",
    type: "currency",
    editable: true,
    cellAttributes: { alignment: "left" },
  },
];

export default class AccountListWithPagination extends LightningElement {
  accounts = [];
  filteredAccounts = [];
  saveDraftValues = [];
  pagedAccounts;
  searchKey = "";
  sortBy;
  sortDirection;
  pagination = {
    currentPage: 1,
    pageSize: 10,
  };
  wiredAccountsResult;
  isEditable = false;
  labels = LABELS;
  columns = COLUMNS;

  @wire(getAccountData)
  loadAccountData(result) {
    this.wiredAccountsResult = result;
    const { data, error } = result;
    if (data) {
      this.accounts = data.accounts.map((acc) => ({
        ...acc,
        OwnerName: acc.Owner?.Name || "",
        accountUrl: `/lightning/r/Account/${acc.Id}/view`,
      }));
      this.filteredAccounts = [...this.accounts];
      this.isEditable = data.isEditable;
      this.updatePagination();
    } else if (error) {
      this.showToast(
        LABELS.error.title,
        error.body?.message || LABELS.error.message,
        LABELS.error.variant
      );
    }
  }

  updatePagination() {
    const totalRecords = this.filteredAccounts.length;
    this.pagination.totalPages = Math.ceil(
      totalRecords / this.pagination.pageSize
    );
    this.pagedAccounts = this.getPageData();
  }

  getPageData() {
    const start = (this.pagination.currentPage - 1) * this.pagination.pageSize;
    return this.filteredAccounts.slice(start, start + this.pagination.pageSize);
  }

  handleSearch({ target: { value } }) {
    this.searchKey = value.toLowerCase();
    this.filteredAccounts = this.accounts.filter(({ Name }) =>
      Name.toLowerCase().includes(this.searchKey)
    );
    this.pagination.currentPage = 1;
    this.updatePagination();
  }

  handleSave(event) {
    if (!this.isEditable) {
      this.showToast(
        LABELS.error.title,
        "You don't have permission to edit this object.",
        LABELS.error.variant
      );
      return;
    }

    const draftValues = event.detail.draftValues;
    const recordInputs = draftValues.map((draft) => ({ fields: { ...draft } }));

    Promise.all(recordInputs.map(updateRecord))
      .then(() => {
        this.showToast(
          LABELS.success.title,
          LABELS.success.message,
          LABELS.success.variant
        );
        this.filteredAccounts = this.filteredAccounts.map((account) => {
          const updatedDraft = draftValues.find(
            (draft) => draft.Id === account.Id
          );
          return updatedDraft ? { ...account, ...updatedDraft } : account;
        });

        this.saveDraftValues = [];
        this.updatePagination();

        return this.refreshData();
      })
      .then(this.updatePagination.bind(this))
      .catch((error) => {
        this.showToast(
          LABELS.error.title,
          error.body?.message || LABELS.error.message,
          LABELS.error.variant
        );
      });
  }

  showToast(title, message, variant) {
    this.dispatchEvent(
      new ShowToastEvent({
        title,
        message,
        variant,
        mode: "dismissable",
      })
    );
  }

  refreshData() {
    return refreshApex(this.wiredAccountsResult);
  }

  nextPage() {
    if (!this.isLastPage) {
      this.pagination.currentPage++;
      this.updatePagination();
    }
  }

  previousPage() {
    if (!this.isFirstPage) {
      this.pagination.currentPage--;
      this.updatePagination();
    }
  }

  handleSort({ detail: { fieldName, sortDirection } }) {
    this.sortBy = fieldName;
    this.sortDirection = sortDirection;

    const sortOrder = sortDirection === "asc" ? 1 : -1;

    this.filteredAccounts.sort((a, b) => {
      const aValue = a[fieldName] ? a[fieldName].toLowerCase() : "";
      const bValue = b[fieldName] ? b[fieldName].toLowerCase() : "";
      return sortOrder * aValue.localeCompare(bValue);
    });

    this.updatePagination();
  }

  get isFirstPage() {
    return this.pagination.currentPage === 1;
  }

  get isLastPage() {
    return this.pagination.currentPage === this.pagination.totalPages;
  }
}
