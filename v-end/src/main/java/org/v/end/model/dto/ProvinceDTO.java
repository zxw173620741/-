package org.v.end.model.dto;

import java.util.List;

public class ProvinceDTO {
    private String provinceName;
    private List<CityDTO> cities;

    public ProvinceDTO() {
    }

    public ProvinceDTO(String provinceName, List<CityDTO> cities) {
        this.provinceName = provinceName;
        this.cities = cities;
    }

    public String getProvinceName() {
        return provinceName;
    }

    public void setProvinceName(String provinceName) {
        this.provinceName = provinceName;
    }

    public List<CityDTO> getCities() {
        return cities;
    }

    public void setCities(List<CityDTO> cities) {
        this.cities = cities;
    }
}
