import React from "react";
import { Button, Result } from "antd";

/** Lỗi render một trang không làm trắng cả ứng dụng */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Lỗi giao diện:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Result
        status="error"
        title="Có lỗi khi hiển thị trang"
        subTitle={String(this.state.error?.message || this.state.error)}
        extra={<Button type="primary" onClick={() => window.location.reload()}>Tải lại trang</Button>}
      />
    );
  }
}
