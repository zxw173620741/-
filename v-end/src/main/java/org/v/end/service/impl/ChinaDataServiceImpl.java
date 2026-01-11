package org.v.end.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.v.end.model.dto.ChinaDataDTO;
import org.v.end.model.dto.CityDTO;
import org.v.end.model.dto.ProvinceDTO;
import org.v.end.service.ChinaDataService;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class ChinaDataServiceImpl implements ChinaDataService {

    private final ObjectMapper objectMapper;

    public ChinaDataServiceImpl() {
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public ChinaDataDTO getChinaData() {
        try {
            File jsonFile = new File("src/main/java/org/v/end/json/china.JSON");
            JsonNode rootNode = objectMapper.readTree(jsonFile);
            JsonNode provincesArray = rootNode.path("provinces");

            List<ProvinceDTO> provinces = new ArrayList<>();

            for (JsonNode provinceNode : provincesArray) {
                String provinceName = provinceNode.path("province_name").asText();
                JsonNode citiesArray = provinceNode.path("cities");

                List<CityDTO> cities = new ArrayList<>();
                for (JsonNode cityNode : citiesArray) {
                    String cityName = cityNode.path("city_name").asText();
                    String weatherCode = cityNode.path("weather_code").asText();
                    cities.add(new CityDTO(cityName, weatherCode));
                }

                provinces.add(new ProvinceDTO(provinceName, cities));
            }

            return new ChinaDataDTO(provinces);

        } catch (IOException e) {
            throw new RuntimeException("读取中国数据JSON文件失败: " + e.getMessage(), e);
        }
    }
}
