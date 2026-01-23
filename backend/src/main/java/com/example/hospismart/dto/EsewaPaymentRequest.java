package com.example.hospismart.dto;

public class EsewaPaymentRequest {

    private String pid;
    private String refId;
    private Double totalAmount;

    public EsewaPaymentRequest() {}

    public String getPid() {
        return pid;
    }

    public void setPid(String pid) {
        this.pid = pid;
    }

    public String getRefId() {
        return refId;
    }

    public void setRefId(String refId) {
        this.refId = refId;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }
}
