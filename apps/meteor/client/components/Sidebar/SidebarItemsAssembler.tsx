import { Divider } from '@rocket.chat/fuselage';
import { Fragment, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '@rocket.chat/fuselage';

import SidebarNavigationItem from './SidebarNavigationItem';
import type { SidebarItem } from '../../lib/createSidebarItems';
import { isSidebarItem } from '../../lib/createSidebarItems';

type SidebarItemsAssemblerProps = {
	items: SidebarItem[];
	currentPath?: string;
};

const SidebarItemsAssembler = ({ items, currentPath }: SidebarItemsAssemblerProps) => {
	const { t, i18n } = useTranslation();

	return (
		<>
			{items.map((props) => {
                if ('permissionGranted' in props && 
                    typeof props.permissionGranted === 'function' && 
                    !props.permissionGranted()) {
                    return null;
                }
                return(
				<Fragment key={props.i18nLabel}>
					{isSidebarItem(props) ? (
						props.href ? (
                            <Box pis="x16">
                            <SidebarNavigationItem
                                permissionGranted={props.permissionGranted}
                                pathSection={props.href ?? props.pathSection ?? ''}
                                icon={props.icon}
                                label={t((props.i18nLabel || props.name) as Parameters<typeof t>[0])}
                                currentPath={currentPath}
                                tag={props.tag && i18n.exists(props.tag) ? t(props.tag) : props.tag}
                                externalUrl={props.externalUrl}
                                badge={props.badge}
                            />
                            </Box>
                        ) : (
                            /* RENDER AS UNCLICKABLE HEADER */
                            <Box 
                                pi="x20" 
                                pb="x8" 
                                fontScale="p1"
                                color="#ffffff" 
                                style={{ fontWeight: 'bold' }}
                            >
                                {t((props.i18nLabel || props.name) as Parameters<typeof t>[0])}
                            </Box>
                        )
					) : (
						<Divider />
					)}
				</Fragment>)
})}
		</>
	);
};

export default memo(SidebarItemsAssembler);
