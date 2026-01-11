package org.v.end.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.v.end.common.Result;
import org.v.end.model.dto.ChinaDataDTO;
import org.v.end.service.ChinaDataService;

@RestController
@RequestMapping("/api/china")
public class ChinaDataController {

    @Autowired
    private ChinaDataService chinaDataService;

    @GetMapping("/data")
    public Result<ChinaDataDTO> getChinaData() {
        try {
            ChinaDataDTO chinaData = chinaDataService.getChinaData();
            if (chinaData != null) {
                return Result.success(chinaData);
            } else {
                return Result.error("获取中国数据失败");
            }
        } catch (Exception e) {
            return Result.error("获取中国数据失败: " + e.getMessage());
        }
    }
}
