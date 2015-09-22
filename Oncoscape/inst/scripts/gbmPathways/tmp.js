include(../m4-workarounds.txt)
     selectionString = '#oncoscapeTabs a[href="#' + tabIDString + '"]';
     tabIndex = $(selectionString).parent().JAVASCRIPT_INDEX ();
     tabsWidget.tabs( "option", "active", tabIndex);
