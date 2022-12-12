/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useContext } from 'react';
import { NextFieldExtensionOptions } from '../../extensions';
import { Navigate, useNavigate } from 'react-router';
import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  AnalyticsContext,
  useApi,
  useRouteRef,
  useRouteRefParams,
} from '@backstage/core-plugin-api';
import { scaffolderApiRef } from '../../api';
import useAsync from 'react-use/lib/useAsync';
import {
  nextRouteRef,
  scaffolderTaskRouteRef,
  selectedTemplateRouteRef,
} from '../../routes';
import { SecretsContext } from '../../components/secrets/SecretsContext';
import { JsonValue } from '@backstage/types';
import type { ErrorTransformer } from '@rjsf/utils';
import { TemplateWizardContent } from '../TemplateWizardContent/TemplateWizardContent';

export interface TemplateWizardPageProps {
  customFieldExtensions: NextFieldExtensionOptions<any, any>[];
  transformErrors?: ErrorTransformer;
}

export const useTemplateParameterSchema = (templateRef: string) => {
  const scaffolderApi = useApi(scaffolderApiRef);
  const { value, loading, error } = useAsync(
    () => scaffolderApi.getTemplateParameterSchema(templateRef),
    [scaffolderApi, templateRef],
  );

  return { manifest: value, loading, error };
};

export const TemplateWizardPage = (props: TemplateWizardPageProps) => {
  const rootRef = useRouteRef(nextRouteRef);
  const taskRoute = useRouteRef(scaffolderTaskRouteRef);
  const { secrets } = useContext(SecretsContext) ?? {};
  const scaffolderApi = useApi(scaffolderApiRef);
  const navigate = useNavigate();
  const { templateName, namespace } = useRouteRefParams(
    selectedTemplateRouteRef,
  );

  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace,
    name: templateName,
  });

  const onComplete = async (values: Record<string, JsonValue>) => {
    const { taskId } = await scaffolderApi.scaffold({
      templateRef,
      values,
      secrets,
    });

    navigate(taskRoute({ taskId }));
  };

  const onError = () => <Navigate to={rootRef()} />;

  return (
    <AnalyticsContext attributes={{ entityRef: templateRef }}>
      <TemplateWizardContent
        namespace={namespace}
        templateName={templateName}
        onComplete={onComplete}
        onError={onError}
        customFieldExtensions={props.customFieldExtensions}
        transformErrors={props.transformErrors}
      />
    </AnalyticsContext>
  );
};
