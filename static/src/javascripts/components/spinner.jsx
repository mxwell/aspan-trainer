import React from "react";

class Spinner extends React.Component {
    render() {
        return (
            <div
                className={this.props.className}
                style={{ borderTopColor: "#3b82f6", borderRightColor: "#3b82f6" }}>
            </div>
        );
    }
}

export { Spinner };
