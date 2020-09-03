import {ApisauceInstance} from 'apisauce';
import {DataSet as IDataSet, FilterParams, SubSetCountResults, Transcriber, VoiceDataResults} from '../../../types';
import {getGeneralApiProblem} from '../api-problem';
import {
  AssignTranscribersToDataSetRequest,
  assignTranscribersToDataSetResult,
  createTrainingSet,
  getAllResult,
  getDownloadLinkResult,
  getEvaluationDownloadLink,
  getSubSet,
  getSubSetCount,
  PostDataSetRequest,
  postDataSetResult,
  ProblemKind,
  removeTranscriberFromDataSetResult,
  requestEvaluation,
  ServerError,
} from '../types';
import {ParentApi} from './parent-api';

/**
 * Manages all data set requests to the API.
 */
export class DataSet extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param logout parent method coming from keycloak
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Gets all data sets
   * @param projectId
   */
  async getAll(projectId: string): Promise<getAllResult> {
    const response = await this.apisauce.get<IDataSet[], ServerError>(
      this.getPathWithOrganization(`/projects/${projectId}/data-sets`),
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }
    // transform the data into the format we are expecting
    try {
      const dataSets = response.data as IDataSet[];
      return { kind: 'ok', dataSets };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Gets a download link for the data set
   * @param projectId
   * @param dataSetId
   */
  async getDownloadLink(
    projectId: string,
    dataSetId: string,
  ): Promise<getDownloadLinkResult> {
    const response = await this.apisauce.get<{ url: string }, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data-sets/${dataSetId}/download`,
      ),
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }
    // transform the data into the format we are expecting
    try {
      const data = response.data as { url: string };
      return { kind: 'ok', url: data.url };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Creates a new data set
   * @param name
   * @param projectId
   * @param filterParams
   */
  async postDataSet(
    name: string,
    projectId: string,
    filterParams: FilterParams,
  ): Promise<postDataSetResult> {
    // build the request
    const request: PostDataSetRequest = {
      name,
    filterParams: {
      from: filterParams.from,
      till: filterParams.till,
      lengthMax: filterParams["length-max"],
      lengthMin: filterParams["length-min"],
      dataSetIds: filterParams.dataSetIds,
      configId: filterParams.modelConfig,
      status: filterParams.status,
      transcript: filterParams.transcript,
      transcriber: filterParams.transcriber,
    },
    };
    const response = await this.apisauce.post<undefined, ServerError>(
      this.getPathWithOrganization(`/projects/${projectId}/data-sets`),
      request,
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }
    return { kind: 'ok' };
  }

  /**
   * Assign transcribers to a data set
   * @param projectId
   * @param dataSetId
   * @param transcriberIds
   */
  async assignTranscribersToDataSet(
    projectId: string,
    dataSetId: string,
    transcriberIds: string[],
  ): Promise<assignTranscribersToDataSetResult> {
    // build the request
    const request: AssignTranscribersToDataSetRequest = {
      transcribers: transcriberIds,
    };
    const response = await this.apisauce.post<Transcriber, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data-sets/${dataSetId}`,
      ),
      request,
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }
    // transform the data into the format we are expecting
    try {
      const transcribers = response.data as Transcriber[];
      return { kind: 'ok', transcribers };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Assign transcribers to a data set
   * @param projectId
   * @param dataSetId
   * @param transcriberId
   */
  async removeTranscriberFromDataSet(
    projectId: string,
    dataSetId: string,
    transcriberId: string,
  ): Promise<removeTranscriberFromDataSetResult> {
    const response = await this.apisauce.delete<undefined, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data-sets/${dataSetId}/transcribers/${transcriberId}`,
      ),
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }
    return { kind: 'ok' };
  }

  async createTrainingSet(projectId: string, dataSetId: string): Promise<createTrainingSet> {
    const response = await this.apisauce.post<undefined, ServerError>(
        this.getPathWithOrganization(
            `/projects/${projectId}/data-sets/${dataSetId}/sub-sets`
        )
    );
    if(!response.ok) {
      const problem = getGeneralApiProblem(response);
      if(problem) {
        if(problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }
    return { kind: 'ok' };
  }

  async getSubSet(projectId: string, dataSetId: string, params: any): Promise<getSubSet> {
    // const param = types.length ? types : null;
    const response = await this.apisauce.get<VoiceDataResults, ServerError>(
        this.getPathWithOrganization(
            `/projects/${projectId}/data-sets/${dataSetId}/sub-sets`
        ), params
    );
    if(!response.ok) {
      const problem = getGeneralApiProblem(response);
      if(problem) {
        if(problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }

    try {
      const subSets = response.data as VoiceDataResults;
      return { kind: 'ok', subSets };
    } catch {
      return {kind: ProblemKind['bad-data']};
    }
  }

  async getSubSetCount(projectId: string, dataSetId: string): Promise<getSubSetCount> {
    const response = await this.apisauce.get<SubSetCountResults, ServerError>(
        this.getPathWithOrganization(`/projects/${projectId}/data-sets/${dataSetId}/sub-sets/count`));
    if(!response.ok) {
      const problem = getGeneralApiProblem(response);
      if(problem) {
        if(problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }

    try {
      const count = response.data as SubSetCountResults;
      return { kind: 'ok', count };
    } catch {
      return {kind: ProblemKind['bad-data']};
    }
  }

  async requestEvaluation(projectId: string, dataSetId: string, modelConfigId: string): Promise<requestEvaluation> {
    const param = { modelConfigId };
    const response = await this.apisauce.post<undefined, ServerError>(
        this.getPathWithOrganization(
            `/projects/${projectId}/data-sets/${dataSetId}/evaluate`,
        ),
        param,
    );
    if(!response.ok) {
      const problem = getGeneralApiProblem(response);
      if(problem) {
        if(problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }

    try {
      return { kind: 'ok' };
    } catch {
      return {kind: ProblemKind['bad-data']};
    }

  }

  async getEvaluationDownloadLink (projectId: string, dataSetId: string): Promise<getEvaluationDownloadLink> {
    const response = await this.apisauce.get<undefined, ServerError>(
        this.getPathWithOrganization(
            `/projects/${projectId}/data-sets/${dataSetId}/download-eval`,
        )
    );
    if(!response.ok) {
      const problem = getGeneralApiProblem(response);
      if(problem) {
        if(problem.kind == ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }
    try {
      const data = response.data as any;
      return { kind: 'ok', url: data.url }
    } catch {
      return { kind: ProblemKind['bad-data'] }
    }
  }
}
