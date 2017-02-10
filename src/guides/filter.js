import log from "../log";
import {reduce, unique} from "../utils/array-utils";
import emptyOnError from '../empty-on-error';
import state from '../state';
import FilterCollector from './filter-collector'

export default class Filter {
    static process(locatedTargets, data, handler) {
        var targetInfo = locatedTargets.reduce((result, info) => {
            result.elements = result.elements.concat(info.elements);
            result.scopeElements.push(info.scopeElement);
            return result;
        }, {elements: [], scopeElements: []});

        return unique(targetInfo.elements, emptyOnError((err, uniqueTargets) => {
            targetInfo.elements = uniqueTargets;

            return Filter.filter({...data, ...targetInfo}, handler);
        }));
    }

    static filter(data, callback) {
        let config = state.getConfig();
        let {target, elements:unfilteredElements, extensions} = data;
        let filters = FilterCollector.getFilters(target, extensions);

        let beforeFilterElements = FilterCollector.beforeFilters(unfilteredElements, extensions, data);
        let afterFilters = FilterCollector.afterFilters(callback, extensions, data);

        return reduce(filters, beforeFilterElements, (filteredElements, filter, executeCallback) => {
            return filter({...data, elements: filteredElements}, function (err, results) {
                if (typeof(results) == 'undefined')
                    results = [];

                log.debug("Filtered count:", results.length);

                return executeCallback(err, results);
            });
        }, afterFilters);
    }
}