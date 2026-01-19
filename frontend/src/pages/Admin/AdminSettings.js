import React, { useEffect, useState } from "react";
import {
  Tabs,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  message,
} from "antd";
import "../../styles/AdminManagement.css";

const { TabPane } = Tabs;

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      form.setFieldsValue(data);
    } catch (err) {
      message.error("Failed to load settings");
    }
  };

  const onSave = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      message.success("Settings updated successfully!");
    } catch (err) {
      message.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="department-management settings-page">
      <div className="header-bar">
        <h1>⚙️ System Settings</h1>
      </div>

      <div className="settings-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={onSave}
          className="settings-form"
        >
          <Tabs defaultActiveKey="1" className="settings-tabs">
            <TabPane tab="Hospital Profile" key="1">
              <div className="form-grid">
                <Form.Item label="Hospital Name" name="hospitalName" rules={[{ required: true }]}>
                  <Input size="large" placeholder="Eg: City Hospital Pvt. Ltd." />
                </Form.Item>

                <Form.Item label="Tagline" name="tagline">
                  <Input size="large" placeholder="Eg: Care You Can Trust" />
                </Form.Item>

                <Form.Item label="Full Address" name="address" rules={[{ required: true }]}>
                  <Input size="large" placeholder="Eg: Kathmandu, Nepal" />
                </Form.Item>

                <Form.Item label="Phone Number" name="phone">
                  <Input size="large" placeholder="01-4444444" />
                </Form.Item>

                <Form.Item label="Emergency Contact" name="emergencyNo">
                  <Input size="large" placeholder="9800000000" />
                </Form.Item>

                <Form.Item label="Official Email" name="email">
                  <Input size="large" placeholder="info@hospital.com" />
                </Form.Item>

                <Form.Item label="GSTIN / PAN / VAT" name="gstin">
                  <Input size="large" />
                </Form.Item>

                <Form.Item label="License / Registration No" name="licenseNo">
                  <Input size="large" />
                </Form.Item>
              </div>
            </TabPane>

            <TabPane tab="Billing & Tax" key="2">
              <div className="form-grid">
                <Form.Item label="GST Rate (%)" name="gstRate">
                  <InputNumber min={0} max={50} size="large" className="full-width" placeholder="13 or 18" />
                </Form.Item>

                <Form.Item label="OPD Bill Prefix" name="opdPrefix">
                  <Input size="large" placeholder="Eg: OPD-" />
                </Form.Item>

                <Form.Item label="IPD Bill Prefix" name="ipdPrefix">
                  <Input size="large" placeholder="Eg: IPD-" />
                </Form.Item>

                <Form.Item label="Pharmacy Bill Prefix" name="pharmacyPrefix">
                  <Input size="large" placeholder="Eg: PHARM-" />
                </Form.Item>
              </div>
            </TabPane>

            <TabPane tab="Appointments" key="3">
              <div className="form-grid">
                <Form.Item label="Default Slot Duration (minutes)" name="defaultSlotMinutes">
                  <InputNumber min={5} max={60} size="large" className="full-width" placeholder="15" />
                </Form.Item>

                <Form.Item label="Max Bookings Per Slot" name="maxBookingsPerSlot">
                  <InputNumber min={1} max={10} size="large" className="full-width" placeholder="1" />
                </Form.Item>

                <Form.Item label="Allow Online Booking" name="onlineBookingAllowed" valuePropName="checked">
                  <Switch size="default" />
                </Form.Item>
              </div>
            </TabPane>

            <TabPane tab="Notifications" key="4">
              <div className="form-grid">
                <Form.Item label="Email Notifications" name={["notifications", "email"]} valuePropName="checked">
                  <Switch size="default" />
                </Form.Item>

                <Form.Item label="SMS Notifications" name={["notifications", "sms"]} valuePropName="checked">
                  <Switch size="default" />
                </Form.Item>

                <Form.Item label="WhatsApp Notifications" name={["notifications", "whatsapp"]} valuePropName="checked">
                  <Switch size="default" />
                </Form.Item>
              </div>
            </TabPane>
          </Tabs>

          <div className="form-actions">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              className="save-settings-btn"
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AdminSettings;