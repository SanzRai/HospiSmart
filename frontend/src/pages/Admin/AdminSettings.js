import React, { useEffect, useState } from "react";
import {
  Tabs,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Card,
  message,
} from "antd";
import axios from "axios";

const { TabPane } = Tabs;

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Fetch settings on page load
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/admin/settings");
      form.setFieldsValue(res.data);
    } catch (err) {
      console.error("Error loading settings", err);
      message.error("Failed to load settings!");
    }
  };

  const onSave = async (values) => {
    setLoading(true);
    try {
      await axios.put("http://localhost:8080/api/admin/settings", values);

      message.success("Settings saved successfully!");
      setLoading(false);
    } catch (err) {
      console.error("Error saving settings", err);
      message.error("Failed to save settings!");
      setLoading(false);
    }
  };

  return (
    <Card title="Admin Settings" bordered={false} className="shadow-md">
      <Form
        layout="vertical"
        form={form}
        onFinish={onSave}
        initialValues={{
          onlineBookingAllowed: true,
          notifications: {
            email: true,
            sms: false,
            whatsapp: false,
          },
        }}
      >
        <Tabs defaultActiveKey="1">
          {/* ---------------------------------------------------
            1. HOSPITAL PROFILE
          ---------------------------------------------------- */}
          <TabPane tab="Hospital Profile" key="1">
            <Form.Item
              label="Hospital Name"
              name="hospitalName"
              rules={[{ required: true, message: "Hospital name is required" }]}
            >
              <Input placeholder="Eg: City Hospital Pvt. Ltd." />
            </Form.Item>

            <Form.Item label="Tagline" name="tagline">
              <Input placeholder="Eg: Care You Can Trust" />
            </Form.Item>

            <Form.Item
              label="Address"
              name="address"
              rules={[{ required: true, message: "Address is required" }]}
            >
              <Input placeholder="Eg: Kathmandu, Nepal" />
            </Form.Item>

            <Form.Item label="Phone Number" name="phone">
              <Input placeholder="01-4444444" />
            </Form.Item>

            <Form.Item label="Emergency Contact" name="emergencyNo">
              <Input placeholder="9800000000" />
            </Form.Item>

            <Form.Item label="Email" name="email">
              <Input placeholder="info@hospital.com" />
            </Form.Item>

            <Form.Item label="GSTIN" name="gstin">
              <Input />
            </Form.Item>

            <Form.Item label="License Number" name="licenseNo">
              <Input />
            </Form.Item>
          </TabPane>

          {/* ---------------------------------------------------
            2. BILLING & TAX
          ---------------------------------------------------- */}
          <TabPane tab="Billing & Tax" key="2">
            <Form.Item label="GST Rate (%)" name="gstRate">
              <InputNumber min={0} max={50} className="w-full" placeholder="Eg: 18" />
            </Form.Item>

            <Form.Item label="OPD Bill Prefix" name="opdPrefix">
              <Input placeholder="Eg: OPD-" />
            </Form.Item>

            <Form.Item label="IPD Bill Prefix" name="ipdPrefix">
              <Input placeholder="Eg: IPD-" />
            </Form.Item>

            <Form.Item label="Pharmacy Bill Prefix" name="pharmacyPrefix">
              <Input placeholder="Eg: PHARM-" />
            </Form.Item>
          </TabPane>

          {/* ---------------------------------------------------
            3. APPOINTMENTS
          ---------------------------------------------------- */}
          <TabPane tab="Appointments" key="3">
            <Form.Item label="Default Slot Duration (minutes)" name="defaultSlotMinutes">
              <InputNumber min={5} max={60} className="w-full" placeholder="Eg: 15" />
            </Form.Item>

            <Form.Item label="Max Bookings Per Slot" name="maxBookingsPerSlot">
              <InputNumber min={1} max={10} className="w-full" placeholder="Eg: 1" />
            </Form.Item>

            <Form.Item
              label="Allow Online Booking"
              name="onlineBookingAllowed"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </TabPane>

          {/* ---------------------------------------------------
            4. NOTIFICATIONS
          ---------------------------------------------------- */}
          <TabPane tab="Notifications" key="4">
            <Form.Item
              label="Email Notifications"
              name={["notifications", "email"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="SMS Notifications"
              name={["notifications", "sms"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="WhatsApp Notifications"
              name={["notifications", "whatsapp"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </TabPane>
        </Tabs>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          className="mt-3"
        >
          Save Changes
        </Button>
      </Form>
    </Card>
  );
};

export default AdminSettings;
