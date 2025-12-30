import { Button, ButtonGroup, Field, FieldLabel, FieldRow, InputBox, Select, TextInput } from '@rocket.chat/fuselage';
import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
 	ContextualbarHeader,
 	ContextualbarTitle,
 	ContextualbarClose,
 	ContextualbarScrollableContent,
 	ContextualbarFooter,
 	ContextualbarDialog,
} from '../../../../components/Contextualbar';
import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import AutoCompleteDepartmentMultiple from '../../components/AutoCompleteDepartmentMultiple';
import AutoCompleteMultipleAgent from '../../components/AutoCompleteMultipleAgent';
import { useOmnichannelPriorities } from '../../hooks/useOmnichannelPriorities';
import type { ChatsFiltersQuery } from '../contexts/ChatsContext';
import { useChatsContext } from '../contexts/ChatsContext';

type ChatsFiltersContextualBarProps = {
	onClose: () => void;
};

const ChatsFiltersContextualBar = ({ onClose }: ChatsFiltersContextualBarProps) => {
	const { t } = useTranslation();
	const canViewLivechatRooms = usePermission('view-livechat-rooms');
	const canViewCustomFields = usePermission('view-livechat-room-customfields');
	const isEnterprise = useHasLicenseModule('livechat-enterprise');

	const allCustomFields = useEndpoint('GET', '/v1/livechat/custom-fields');
	const { data } = useQuery({ queryKey: ['livechat/custom-fields'], queryFn: async () => allCustomFields() });
	const contactCustomFields = data?.customFields.filter((customField) => customField.scope !== 'visitor');

	const { filtersQuery, setFiltersQuery, resetFiltersQuery, hasAppliedFilters } = useChatsContext();

	const { handleSubmit, control, reset } = useForm<ChatsFiltersQuery>({
		values: filtersQuery,
	});

	const statusOptions: [string, string][] = [
		['all', t('All')],
		['closed', t('Closed')],
		['opened', t('Room_Status_Open')],
	];

	const handleSubmitFilters = (data: ChatsFiltersQuery) => setFiltersQuery(({ guest }) => ({ ...data, guest }));

	const handleResetFilters = () => {
		resetFiltersQuery();
		reset();
	};

	const formId = useId();
	const fromFieldId = useId();
	const toFieldId = useId();
	const servedByFieldId = useId();
	const statusFieldId = useId();
	const departmentFieldId = useId();
	const priorityFieldId = useId();

	const { data: priorities } = useOmnichannelPriorities();

	const priorityOptions = (
		[
			['', t('All')],
			['without-priority', t('Unprioritized')],
			...(priorities?.map(({ _id, dirty, name, i18n }: any) => [_id, dirty && name ? name : t(i18n)]) ?? []),
		]
	) as [string, string][];

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Filter')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent is='form' id={formId} onSubmit={handleSubmit(handleSubmitFilters)}>
				<Field>
					<FieldLabel htmlFor={fromFieldId}>{t('From')}</FieldLabel>
					<FieldRow>
						<Controller
							name='from'
							control={control}
							render={({ field }) => (
								<InputBox type='date' id={fromFieldId} placeholder='mm/dd/yyyy' max={format(new Date(), 'yyyy-MM-dd')} {...field} />
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor={toFieldId}>{t('To')}</FieldLabel>
					<FieldRow>
						<Controller
							name='to'
							control={control}
							render={({ field }) => (
								<InputBox type='date' id={toFieldId} placeholder='mm/dd/yyyy' max={format(new Date(), 'yyyy-MM-dd')} {...field} />
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor={priorityFieldId}>{t('Priority')}</FieldLabel>
					<FieldRow>
						<Controller
							name='priority'
							control={control}
							render={({ field }) => <Select {...field} id={priorityFieldId} options={priorityOptions} />}
						/>
					</FieldRow>
				</Field>

				{canViewLivechatRooms && (
					<Field>
						<FieldLabel is='span' id={servedByFieldId}>
							{t('Agent')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='servedBy'
								control={control}
								render={({ field: { value, onChange } }) => (
									<AutoCompleteMultipleAgent aria-labelledby={servedByFieldId} value={value} onChange={onChange} placeholder={t('Select_an_option')} haveDbEngage />
								)}
							/>
						</FieldRow>
					</Field>
				)}
				{/* Status moved below Department to match requested order */}
				<Field>
					<FieldLabel is='span' id={departmentFieldId}>
						{t('Department')}
					</FieldLabel>
					<FieldRow>
						<Controller
							name='department'
							control={control}
							render={({ field: { value, onChange } }) => (
								<AutoCompleteDepartmentMultiple
									aria-labelledby={departmentFieldId}
									showArchived
									value={value}
									onChange={onChange}
									onlyMyDepartments
								/>
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel is='span' id={statusFieldId}>
						{t('Status')}
					</FieldLabel>
					<Controller
						name='status'
						control={control}
						render={({ field }) => (
							<Select {...field} aria-labelledby={statusFieldId} options={statusOptions} placeholder={t('Select_an_option')} style={{ fontWeight: 'normal' }} />
						)}
					/>
				</Field>
				{/* Tags and Units filters removed per request */}
				{canViewCustomFields &&
					contactCustomFields?.map((customField) => {
						if (customField.type === 'select') {
							return (
								<Field key={customField._id}>
									<FieldLabel is='span' id={customField._id}>
										{customField.label}
									</FieldLabel>
									<FieldRow>
										<Controller
											name={customField._id}
											control={control}
											render={({ field }) => (
												<Select
													{...field}
													aria-labelledby={customField._id}
													value={field.value as string}
													options={(customField.options || '').split(',').map((item) => [item, item])}
												/>
											)}
										/>
									</FieldRow>
								</Field>
							);
						}

						return (
							<Field key={customField._id}>
								<FieldLabel htmlFor={customField._id}>{customField.label}</FieldLabel>
								<FieldRow>
									<Controller
										name={customField._id}
										control={control}
										render={({ field }) => <TextInput {...field} id={customField._id} value={field.value as string} />}
									/>
								</FieldRow>
							</Field>
						);
					})}
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button disabled={!hasAppliedFilters} onClick={handleResetFilters}>
						{t('Clear_filters')}
					</Button>
					<Button type='submit' form={formId} primary>
						{t('Apply')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};

export default ChatsFiltersContextualBar;
