/** @jsx React.DOM */
var React = require('react/addons'),
	invariant = require('react/lib/invariant');

// Determine if a node from event.target is a Tab element
function isTabNode(node) {
	return node.nodeName === 'LI' && node.getAttribute('role') === 'tab';
}

// Get a universally unique identifier
var uuid = (function () {
	var count = 0;
	return function () {
		return 'react-tabs-' + count++;
	}
})();

module.exports = React.createClass({
	displayName: 'Tabs',

	propTypes: {
		selectedIndex: React.PropTypes.number,
		onSelect: React.PropTypes.func,
		focus: React.PropTypes.bool
	},

	getDefaultProps: function () {
		return {
			selectedIndex: 0,
			focus: false
		};
	},

	getInitialState: function () {
		var tabIds = [],
			panelIds = [];

		// Setup tab/panel ids
		React.Children.forEach(this.props.children[0].props.children, function () {
			tabIds.push(uuid());
			panelIds.push(uuid());
		});

		return {
			selectedIndex: this.props.selectedIndex,
			focus: this.props.focus,
			tabIds: tabIds,
			panelIds: panelIds
		};
	},

	componentWillMount: function () {
		var tabsCount = this.getTabsCount(),
			panelsCount = this.getPanelsCount();

		invariant(
			tabsCount === panelsCount,
			'There should be an equal number of Tabs and TabPanels. ' +
			'Received %s Tabs and %s TabPanels.',
			tabsCount, panelsCount
		);
	},

	setSelected: function (index, focus) {
		// Don't do anything if nothing has changed
		if (index === this.state.selectedIndex) return;
		// Check index boundary
		if (index < 0 || index >= this.getTabsCount()) return;

		// Keep reference to last index for event handler
		var last = this.state.selectedIndex;

		// Update selected index
		this.setState({ selectedIndex: index, focus: focus === true });

		// Call change event handler
		if (typeof this.props.onSelect === 'function') {
			this.props.onSelect(index, last);
		}
	},

	getTabsCount: function () {
		return React.Children.count(this.props.children[0].props.children);
	},

	getPanelsCount: function () {
		return React.Children.count(this.props.children.slice(1));
	},

	getTabList: function () {
		return this.refs.tablist;
	},

	getTab: function (index) {
		return this.refs['tabs-' + index];
	},

	getPanel: function (index) {
		return this.refs['panels-' + index];
	},

	handleClick: function (e) {
		var node = e.target;
		do {
			if (isTabNode(node)) {
				var index = [].slice.call(node.parentNode.children).indexOf(node);
				this.setSelected(index);
				return;
			}
		} while (node = node.parentNode);
	},

	handleKeyDown: function (e) {
		if (isTabNode(e.target)) {
			var index = this.state.selectedIndex,
				max = this.getTabsCount() - 1,
				preventDefault = false;

			// Select next tab to the left
			if (e.keyCode === 37 || e.keyCode === 38) {
				index -= 1;
				preventDefault = true;

				// Wrap back to last tab if index is negative
				if (index < 0) {
					index = max;
				}
			}
			// Select next tab to the right
			else if (e.keyCode === 39 || e.keyCode === 40) {
				index += 1;
				preventDefault = true;

				// Wrap back to first tab if index exceeds max
				if (index > max) {
					index = 0;
				}
			}

			// This prevents scrollbars from moving around
			if (preventDefault) {
				e.preventDefault();
			}

			this.setSelected(index, true);
		}
	},

	removeFocus: function() {
		this.setState({
			focus: false
		});
	},

	render: function () {
		var index = 0,
			count = 0,
			children,
			state = this.state,
			removeFocus = this.removeFocus;

		// Map children to dynamically setup refs
		children = React.Children.map(this.props.children, function (child) {
			var result = null;

			// Clone TabList and Tab components to have refs
			if (count++ === 0) {
				result = React.addons.cloneWithProps(child, {
					ref: 'tablist',
					children: React.Children.map(child.props.children, function (tab) {
						var ref = 'tabs-' + index,
							id = state.tabIds[index],
							panelId = state.panelIds[index],
							selected = state.selectedIndex === index,
							focus = selected && state.focus;

						index++;

						return React.addons.cloneWithProps(tab, {
							ref: ref,
							id: id,
							panelId: panelId,
							selected: selected,
							focus: focus,
							onBlur: removeFocus
						});
					})
				});

				// Reset index for panels
				index = 0;
			}
			// Clone TabPanel components to have refs
			else {
				var ref = 'panels-' + index,
					id = state.panelIds[index],
					tabId = state.tabIds[index],
					selected = state.selectedIndex === index;

				index ++;

				result = React.addons.cloneWithProps(child, {
					ref: ref,
					id: id,
					tabId: tabId,
					selected: selected
				});
			}

			return result;
		});

		return (
			<div className="react-tabs"
				onClick={this.handleClick}
				onKeyDown={this.handleKeyDown}>
				{children}
			</div>
		);
	}
});
